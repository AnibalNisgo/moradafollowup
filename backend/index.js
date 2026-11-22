const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { join } = require("node:path");
const { askQwen, normalizePhone, prepareReply, recordReply } = require("./atendimento");
const { startWhatsApp } = require("./whatsapp");
const { consoleApi } = require("./console");

try {
  process.loadEnvFile(join(__dirname, ".env"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const PORT = Number(process.env.PORT ?? 3001);

http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (req.url?.startsWith("/api/")) return consoleApi(req, res);

  if (req.method === "GET" && req.url === "/health") {
    return res.end(JSON.stringify({ status: "ok" }));
  }

  if (req.method === "POST" && req.url === "/chat") {
    try {
      let body = "";
      for await (const chunk of req) body += chunk;

      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "JSON inválido" }));
      }
      const { message, phone, messageId } = payload ?? {};

      if (typeof message !== "string" || !message.trim()) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Mensagem inválida" }));
      }

      if (phone === undefined) {
        const answer = await askQwen([{ role: "user", content: message }]);
        return res.end(JSON.stringify({ answer }));
      }
      const normalized = normalizePhone(phone);
      if (!normalized || (messageId !== undefined &&
          (typeof messageId !== "string" || !/^[\w-]{1,128}$/.test(messageId)))) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Telefone ou ID de mensagem inválido" }));
      }
      const reply = await prepareReply({
        phone: normalized,
        message,
        sourceId: `chat:${normalized}:${messageId ?? randomUUID()}`,
        sentAt: new Date().toISOString()
      });
      const outgoing = reply.saved
        ? reply.outgoing
        : await recordReply(reply, message, new Date().toISOString());
      return res.end(JSON.stringify({ answer: outgoing.content, clientId: reply.client.id }));

    } catch (error) {
      res.writeHead(500);
      return res.end(JSON.stringify({ error: error.message }));
    }
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Rota não encontrada" }));

}).listen(PORT, "127.0.0.1", () => {
  console.log(`Morada Backend: http://localhost:${PORT}`);
  startWhatsApp();
});
