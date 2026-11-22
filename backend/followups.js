const { rest, saveMessage } = require("./supabase");

const TIME_ZONE = "America/Sao_Paulo";
const FOLLOWUP_TEXT = "Olá! Você gostaria de continuar o atendimento imobiliário com a Morada? Estou à disposição.";

function scheduleTime(sentAt, days) {
  return Temporal.Instant.from(sentAt).toZonedDateTimeISO(TIME_ZONE)
    .add({ days }).toInstant().toString();
}

async function scheduleFollowup(message, scheduledAt) {
  if (!scheduledAt) {
    const [settings] = await rest("settings", { id: "eq.1", select: "followup_days" });
    if (!settings) throw new Error("Prazo de follow-up não configurado");
    scheduledAt = scheduleTime(message.sent_at, settings.followup_days);
  }
  const [row] = await rest("followups", { on_conflict: "client_id,trigger_message_id" }, {
    method: "POST",
    body: { client_id: message.client_id, trigger_message_id: message.id, scheduled_at: scheduledAt },
    prefer: "resolution=ignore-duplicates,return=representation"
  });
  return row;
}

function updateFollowup(id, current, body) {
  return rest("followups", { id: `eq.${id}`, status: `eq.${current}` }, {
    method: "PATCH",
    body,
    prefer: "return=representation"
  });
}

function cancelFollowups(clientId) {
  return rest("followups", { client_id: `eq.${clientId}`, status: "eq.programado" }, {
    method: "PATCH",
    body: { status: "cancelado" },
    prefer: "return=minimal"
  });
}

async function latestWhatsAppMessage(clientId) {
  const [latest] = await rest("messages", {
    client_id: `eq.${clientId}`,
    whatsapp_message_id: "not.is.null",
    order: "sent_at.desc,sender.asc,id.desc",
    limit: "1"
  });
  return latest;
}

function authorizedClient(client, allowed) {
  return client?.whatsapp_id && allowed.has(client.phone);
}

async function restoreFollowups(allowed) {
  const clients = await rest("clients", { whatsapp_id: "not.is.null" });
  for (const client of clients.filter(client => authorizedClient(client, allowed))) {
    const interrupted = await rest("followups", { client_id: `eq.${client.id}`, status: "eq.enviando" });
    for (const row of interrupted) {
      const [message] = await rest("messages", { id: `eq.${row.id}`, select: "sent_at" });
      await updateFollowup(row.id, "enviando", message
        ? { status: "enviado", sent_at: message.sent_at }
        : { status: "falhou", last_error: "Envio interrompido; entrega indeterminada." });
    }
    const latest = await latestWhatsAppMessage(client.id);
    if (latest?.sender === "assistente" && latest.kind === "normal") {
      await scheduleFollowup(latest);
    }
  }
}

async function sendDueFollowups({ allowed, send, now = new Date() }) {
  const rows = await rest("followups", {
    status: "eq.programado",
    scheduled_at: `lte.${now.toISOString()}`,
    select: "id,client_id,trigger_message_id,clients(phone,whatsapp_id)",
    order: "scheduled_at.asc"
  });
  for (const row of rows) {
    if (!authorizedClient(row.clients, allowed)) continue;
    const [claimed] = await updateFollowup(row.id, "programado", { status: "enviando" });
    if (!claimed) continue;
    let recorded;
    try {
      const latest = await latestWhatsAppMessage(row.client_id);
      if (latest?.id !== row.trigger_message_id) {
        await updateFollowup(row.id, "enviando", { status: "cancelado" });
        continue;
      }
      const sent = await send(row.clients.whatsapp_id, FOLLOWUP_TEXT);
      if (!sent?.id?._serialized) throw new Error("Envio sem confirmação de ID");
      const sentAt = new Date(sent.timestamp * 1000).toISOString();
      recorded = await saveMessage({
        id: row.id,
        client_id: row.client_id,
        sender: "assistente",
        kind: "followup",
        content: FOLLOWUP_TEXT,
        sent_at: sentAt,
        whatsapp_message_id: sent.id._serialized
      });
      if (!recorded) throw new Error("Resposta de follow-up já registrada");
      await updateFollowup(row.id, "enviando", { status: "enviado", sent_at: sentAt });
    } catch (error) {
      // Se a mensagem já consta no banco, a retomada finaliza o estado pelo mesmo UUID.
      if (recorded) throw error;
      await updateFollowup(row.id, "enviando", {
        status: "falhou",
        last_error: "Envio ou persistência sem confirmação. Conferir a conversa antes de reenviar."
      });
    }
  }
}

module.exports = { scheduleFollowup, cancelFollowups, restoreFollowups, sendDueFollowups };
