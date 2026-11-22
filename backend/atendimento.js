const { createHash } = require("node:crypto");
const { rest, saveMessage, recentMessages } = require("./supabase");
const { qualifyClient } = require("./qualificacao");

function normalizePhone(value) {
  if (typeof value !== "string" || !/^\+?[\d ().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

// Deriva a mesma chave para reentregas sem depender de memória do processo.
function messageId(source) {
  const bytes = createHash("sha256").update(source).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}

async function askQwen(messages) {
  const response = await fetch("http://127.0.0.1:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "qwen3.5:2b",
      messages,
      stream: false,
      think: false
    }),
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`Ollama: ${response.status}`);
  const data = await response.json();
  const answer = data.message?.content?.trim();
  if (!answer) throw new Error("Ollama retornou resposta vazia");
  return answer;
}

async function findOrCreateClient(phone) {
  const query = { phone: `eq.${phone}`, limit: "1" };
  const [existing] = await rest("clients", query);
  if (existing) return existing;

  const [created] = await rest("clients", { on_conflict: "phone" }, {
    method: "POST",
    body: { phone },
    prefer: "resolution=ignore-duplicates,return=representation"
  });
  if (created) return created;
  const [concurrent] = await rest("clients", query);
  if (!concurrent) throw new Error("Cliente não encontrado após cadastro");
  return concurrent;
}

async function findMessage(id) {
  const [message] = await rest("messages", { id: `eq.${id}`, limit: "1" });
  return message;
}

async function prepareReply({ phone, message, sourceId, whatsappId, sentAt, skipDuplicate, onIncoming }) {
  const client = await findOrCreateClient(phone);
  const incoming = await saveMessage({
    id: messageId(`in:${sourceId}`),
    client_id: client.id,
    sender: "cliente",
    content: message,
    sent_at: sentAt,
    whatsapp_message_id: whatsappId
  });
  if (!incoming && skipDuplicate) return null;
  if (incoming && onIncoming) await onIncoming(client.id);
  if (incoming) await qualifyClient(client.id, incoming.content);
  const id = messageId(`out:${sourceId}`);
  const previous = incoming ? null : await findMessage(id);
  if (previous) return { client, outgoing: previous, saved: true };

  const history = await recentMessages(client.id);
  const answer = await askQwen([
    {
      role: "system",
      content: "Você é o assistente imobiliário Morada. Responda em português do Brasil. Use apenas fatos informados na conversa. Não invente imóveis, disponibilidade, preços ou dados cadastrais. Peça os dados necessários quando faltarem."
    },
    ...history.reverse().map(row => ({
      role: row.sender === "cliente" ? "user" : "assistant",
      content: row.content
    }))
  ]);
  return {
    client,
    outgoing: { id, client_id: client.id, sender: "assistente", content: answer }
  };
}

async function recordReply(reply, message, sentAt, whatsappId, whatsappChatId) {
  const saved = await saveMessage({
    ...reply.outgoing,
    sent_at: sentAt,
    whatsapp_message_id: whatsappId
  });
  if (!saved) {
    const previous = await findMessage(reply.outgoing.id);
    if (!previous) throw new Error("Resposta não encontrada após gravação");
    return previous;
  }
  await rest("clients", {
    id: `eq.${reply.client.id}`,
    or: `(last_interaction_at.is.null,last_interaction_at.lte.${sentAt})`
  }, {
    method: "PATCH",
    body: {
      last_interaction_at: sentAt,
      whatsapp_id: whatsappChatId,
      summary: `Última mensagem do cliente: ${message.replace(/\s+/g, " ").trim().slice(0, 240)}`
    },
    prefer: "return=minimal"
  });
  return saved;
}

module.exports = { normalizePhone, askQwen, prepareReply, recordReply };
