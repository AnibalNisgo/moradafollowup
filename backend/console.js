const { rest } = require("./supabase");
const { whatsappStatus } = require("./whatsapp");

const origins = new Set(["http://localhost:8080", "http://127.0.0.1:8080"]);

async function consoleApi(req, res) {
  const origin = req.headers.origin;
  const host = `127.0.0.1:${req.socket.localPort}`;
  const reply = (status, body) => {
    res.writeHead(status);
    res.end(body === undefined ? undefined : JSON.stringify(body));
  };
  if (!origins.has(origin) || req.headers.host !== host) return reply(403, { error: "Acesso local restrito" });
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Morada-Local");
    return reply(204);
  }
  if (req.headers["x-morada-local"] !== "1") return reply(403, { error: "Acesso local restrito" });

  try {
    if (req.method === "GET" && req.url === "/api/console") {
      const [clients, [settings]] = await Promise.all([
        rest("clients", {
          select: "id,name,phone,address,interest,purpose,status,summary,messages(id,sender,content,sent_at,kind),followups(id,status,scheduled_at,sent_at,messages(sent_at))",
          "messages.order": "sent_at.asc,sender.desc,id.asc",
          "followups.order": "scheduled_at.desc,id.desc"
        }),
        rest("settings", { id: "eq.1", select: "followup_days" })
      ]);
      if (!settings) throw new Error("Configuração de follow-up ausente");
      return reply(200, {
        whatsapp: whatsappStatus(),
        followupDays: settings.followup_days,
        clients: clients.map(({ messages, followups, ...client }) => ({
          ...client,
          awaiting: null,
          messages: messages.map(({ content, sent_at, ...message }) => ({
            ...message, text: content, at: sent_at
          })),
          followups: followups.map(row => ({
            id: row.id,
            status: row.status,
            scheduledAt: row.scheduled_at,
            baseAt: row.messages?.sent_at ?? row.scheduled_at,
            doneAt: row.sent_at
          }))
        }))
      });
    }
    if (req.method === "PATCH" && req.url === "/api/settings") {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 1024) return reply(413, { error: "Solicitação excede o limite" });
      }
      let followupDays;
      try {
        followupDays = JSON.parse(body)?.followupDays;
      } catch {
        return reply(400, { error: "JSON inválido" });
      }
      if (!Number.isInteger(followupDays) || followupDays < 1 || followupDays > 30) {
        return reply(400, { error: "Informe um prazo inteiro de 1 a 30 dias" });
      }
      const [settings] = await rest("settings", { id: "eq.1" }, {
        method: "PATCH",
        body: { followup_days: followupDays },
        prefer: "return=representation"
      });
      if (!settings) throw new Error("Configuração de follow-up ausente");
      return reply(200, { followupDays: settings.followup_days });
    }
    return reply(404, { error: "Rota não encontrada" });
  } catch (error) {
    console.error("Console local:", error.message);
    return reply(502, { error: "Falha na comunicação com o banco" });
  }
}

module.exports = { consoleApi };
