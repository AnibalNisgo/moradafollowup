const { appendFile, mkdir } = require("node:fs/promises");
const { join } = require("node:path");
const { normalizePhone, prepareReply, recordReply } = require("./atendimento");
const { scheduleFollowup, cancelFollowups, restoreFollowups, sendDueFollowups } = require("./followups");

const localPath = join(__dirname, "whatsapp.local");
let status = "desativado";

async function logFailure(stage, error) {
  const reason = /^(Supabase \w+: HTTP \d{3}|Ollama: \d{3})/.exec(error?.message)?.[0]
    ?? "operação não concluída";
  console.error(`WhatsApp: ${stage} — ${reason}`);
  try {
    await mkdir(localPath, { recursive: true });
    await appendFile(join(localPath, "errors.log"), JSON.stringify({
      at: new Date().toISOString(), stage, reason
    }) + "\n");
  } catch {
    console.error("WhatsApp: falha ao gravar o log local");
  }
}

async function handleMessage(client, allowed, incoming) {
  if (incoming.fromMe || incoming.hasMedia || incoming.broadcast || incoming.isStatus ||
      incoming.type !== "chat" || !incoming.body?.trim() || !incoming.id?._serialized) return;
  const [identifier, domain] = incoming.from.split("@");
  if (domain !== "c.us" && domain !== "lid") return;
  console.log(`WhatsApp: texto individual recebido (${domain}).`);
  const number = domain === "lid"
    ? (await client.getContactLidAndPhone([incoming.from]))[0]?.pn?.split("@")[0]
    : identifier;
  const phone = normalizePhone(number);
  if (!phone) {
    console.log("WhatsApp: telefone do remetente não resolvido.");
    return;
  }
  if (!allowed.has(phone)) {
    console.log("WhatsApp: remetente fora da lista de teste.");
    return;
  }
  console.log("WhatsApp: remetente autorizado. Processando atendimento.");

  const reply = await prepareReply({
    phone,
    message: incoming.body,
    sourceId: `whatsapp:${incoming.id._serialized}`,
    whatsappId: incoming.id._serialized,
    sentAt: new Date(incoming.timestamp * 1000).toISOString(),
    skipDuplicate: true,
    onIncoming: cancelFollowups
  });
  if (!reply) {
    console.log("WhatsApp: mensagem duplicada ignorada.");
    return;
  }

  const sent = await client.sendMessage(incoming.from, reply.outgoing.content);
  if (!sent?.id?._serialized) throw new Error("Envio sem confirmação de ID");
  const outgoing = await recordReply(reply, incoming.body, new Date(sent.timestamp * 1000).toISOString(),
    sent.id._serialized, incoming.from);
  console.log("WhatsApp: resposta enviada e registrada.");
  await scheduleFollowup(outgoing);
}

function startWhatsApp() {
  if (process.env.WHATSAPP_ENABLED !== "1") return;
  const allowed = new Set((process.env.WHATSAPP_TEST_NUMBERS ?? "").split(",")
    .map(value => normalizePhone(value.trim())).filter(Boolean));
  if (!allowed.size) {
    console.log("WhatsApp desativado: configure WHATSAPP_TEST_NUMBERS.");
    return;
  }

  const { Client, LocalAuth } = require("whatsapp-web.js");
  const qr = require("qrcode-terminal");
  const executablePath = process.env.WHATSAPP_CHROME_PATH
    ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: localPath }),
    webVersionCache: { type: "local", path: join(localPath, "web-cache") },
    puppeteer: { executablePath, headless: true }
  });
  status = "conectando";
  client.on("qr", code => {
    status = "aguardando QR";
    console.log("WhatsApp: QR disponível para parear a conta de teste.");
    qr.generate(code, { small: true });
  });
  let timer;
  let checking = false;
  client.on("ready", () => {
    status = "conectado";
    console.log(`WhatsApp: conectado. Remetentes autorizados: ${allowed.size}.`);
    if (timer) return;
    let restored = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try {
        if (!restored) {
          await restoreFollowups(allowed);
          restored = true;
        }
        await sendDueFollowups({ allowed, send: client.sendMessage.bind(client) });
      } catch (error) {
        await logFailure("follow-up", error);
      } finally {
        checking = false;
      }
    };
    timer = setInterval(() => void check(), 30_000);
    void check();
  });
  client.on("auth_failure", () => {
    status = "erro de autenticação";
    void logFailure("autenticação");
  });
  client.on("disconnected", () => {
    status = "desconectado";
    clearInterval(timer);
    timer = undefined;
    console.log("WhatsApp: desconectado.");
  });
  client.on("message", incoming => {
    void handleMessage(client, allowed, incoming).catch(error => logFailure("atendimento", error));
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.once(signal, () => {
      void client.destroy().catch(() => {}).finally(() => process.exit());
    });
  }
  void client.initialize().catch(error => {
    status = "erro de conexão";
    return logFailure("inicialização", error);
  });
}

module.exports = { startWhatsApp, whatsappStatus: () => status };
