import type { Client, FollowupInfo } from "./types";

const DAY = 86_400_000;

/**
 * Regra: se a última mensagem da conversa é do atendimento e o cliente não respondeu,
 * programa retorno para (última mensagem do atendimento + N dias), no mesmo horário.
 * Se o cliente respondeu por último, não há retorno (pendente é cancelado).
 * Se a última mensagem já é um follow-up enviado, o retorno está concluído.
 */
export function computeFollowup(client: Client, days: number, now = Date.now()): FollowupInfo | null {
  const last = client.messages[client.messages.length - 1];
  if (!last || last.sender !== "assistente") return null;
  const lastTime = new Date(last.at).getTime();
  const daysWithoutReply = Math.max(0, Math.floor((now - lastTime) / DAY));
  if (last.kind === "followup") {
    const prev = [...client.messages].reverse().find((m) => m.sender === "assistente" && m.kind !== "followup");
    const baseAt = prev?.at ?? last.at;
    return { status: "concluido", baseAt, scheduledAt: last.at, doneAt: last.at, daysWithoutReply };
  }
  const scheduled = lastTime + days * DAY;
  return {
    status: now >= scheduled ? "pendente" : "programado",
    baseAt: last.at,
    scheduledAt: new Date(scheduled).toISOString(),
    daysWithoutReply,
  };
}

export function followupMessage(client: Client): string {
  const first = client.name?.split(" ")[0];
  const what = client.interest ? ` sobre ${client.interest.toLowerCase()}` : "";
  return `Olá${first ? `, ${first}` : ""}! Passando para saber se ainda tem interesse${what}. Posso separar algumas opções para você?`;
}
