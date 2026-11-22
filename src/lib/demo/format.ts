import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ClientStatus, FollowupStatus } from "./types";

export const fmtDateTime = (iso: string | null | undefined) => (iso ? format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Não informado");
export const fmtTime = (iso: string) => format(new Date(iso), "HH:mm");
export const fmtShort = (iso: string) => {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM");
};
export const NI = "Não informado";
export const statusLabel: Record<ClientStatus, string> = { novo: "Novo", em_atendimento: "Em atendimento", aguardando_cliente: "Aguardando cliente", qualificado: "Qualificado" };
export const followLabel: Record<FollowupStatus, string> = { programado: "Programado", pendente: "Pendente", concluido: "Concluído", enviando: "Enviando", cancelado: "Cancelado", falhou: "Falhou" };
export const initials = (n: string | null) => (n ? n.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() : "?");
