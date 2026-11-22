// Tipos do domínio. Estrutura pensada para mapear 1:1 em tabelas futuras (clients, messages, settings).
export type Sender = "cliente" | "assistente";
export type MessageKind = "normal" | "followup";

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  at: string; // ISO
  kind?: MessageKind;
}

export type ClientStatus = "novo" | "em_atendimento" | "aguardando_cliente" | "qualificado";
export type AwaitingField = "interesse" | "finalidade" | "nome" | "endereco" | null;

export interface Client {
  id: string;
  name: string | null;
  phone: string;
  address: string | null;
  interest: string | null;
  purpose: string | null;
  status: ClientStatus;
  awaiting: AwaitingField;
  messages: Message[];
  summary?: string | null;
  followups?: StoredFollowup[];
}

export interface DemoState {
  clients: Client[];
  followupDays: number;
}

export type FollowupStatus = "programado" | "pendente" | "concluido" | "enviando" | "cancelado" | "falhou";
export interface FollowupInfo {
  status: FollowupStatus;
  baseAt: string; // última mensagem do atendimento
  scheduledAt: string;
  daysWithoutReply: number;
  doneAt?: string;
}

export interface StoredFollowup {
  id: string;
  status: Exclude<FollowupStatus, "pendente" | "concluido"> | "enviado";
  baseAt: string;
  scheduledAt: string;
  doneAt: string | null;
}
