import type { AwaitingField, Client } from "./types";

// Camada simulada de atendimento: respostas pré-configuradas + extração por regras.
// Substituível futuramente por um modelo de IA mantendo a mesma assinatura.
export interface AssistantResult {
  updates: Partial<Pick<Client, "name" | "address" | "interest" | "purpose" | "awaiting" | "status">>;
  reply: string;
}

const TYPES = ["casa", "apartamento", "terreno", "sobrado", "kitnet", "sala comercial", "chácara"];
const cap = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());

function extractInterest(t: string): string | null {
  const low = t.toLowerCase();
  const type = TYPES.find((k) => low.includes(k));
  if (!type) return null;
  const city = t.match(/\b(?:em|no|na)\s+([A-ZÀ-Ú][\p{L}]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú][\p{L}]+)*)/u)?.[1];
  const extras: string[] = [];
  if (/praia|mar\b/.test(low)) extras.push("próximo à praia");
  const q = low.match(/(\d)\s*quartos?/);
  if (q) extras.push(`${q[1]} quartos`);
  return [cap(type), city ? `em ${city}` : null, ...extras].filter(Boolean).join(", ");
}
function extractPurpose(t: string): string | null {
  const low = t.toLowerCase();
  if (/investi|renda|alugar para/.test(low)) return "Investimento";
  if (/morar|moradia|família|familia/.test(low)) return "Moradia";
  if (/temporada|férias|ferias|veraneio/.test(low)) return "Temporada";
  return null;
}
function extractName(t: string, awaiting: AwaitingField): string | null {
  const m = t.match(/(?:meu nome é|me chamo|sou o|sou a|aqui é o|aqui é a)\s+([\p{L}]+(?:\s+[\p{L}]+){0,3})/iu);
  if (m?.[1]) return cap(m[1].toLowerCase());
  if (awaiting === "nome") {
    const clean = t.replace(/[.!,]/g, "").trim();
    if (/^[\p{L}\s]{2,40}$/u.test(clean) && clean.split(/\s+/).length <= 4) return cap(clean.toLowerCase());
  }
  return null;
}
function extractAddress(t: string, awaiting: AwaitingField): string | null {
  const m = t.match(/(?:moro (?:na|no|em)|endereço é|resido (?:na|no|em))\s+(.+)/i);
  if (m?.[1]) return m[1].replace(/[.!]$/, "").trim();
  if (/\b(rua|av\.?|avenida|travessa|bairro)\b/i.test(t)) return t.replace(/[.!]$/, "").trim();
  if (awaiting === "endereco" && t.trim().length > 3 && !/não|nao/i.test(t)) return t.replace(/[.!]$/, "").trim();
  return null;
}

export function simulateReply(client: Client, text: string): AssistantResult {
  const u: AssistantResult["updates"] = {};
  const interest = extractInterest(text);
  if (interest && !client.interest) u.interest = interest;
  else if (interest && client.interest && interest.length > client.interest.length) u.interest = interest;
  const purpose = extractPurpose(text);
  if (purpose) u.purpose = purpose;
  const name = extractName(text, client.awaiting);
  if (name && !client.name) u.name = name;
  const address = !interest ? extractAddress(text, client.awaiting) : null;
  if (address && !client.address) u.address = address;
  let skippedAddress = client.awaiting === "endereco" && !address;

  const next = { ...client, ...u };
  const first = next.name?.split(" ")[0];
  let reply: string;
  let awaiting: AwaitingField = null;

  if (!next.interest) {
    reply = client.messages.length === 0 || /^(oi|olá|ola|bom dia|boa tarde|boa noite)/i.test(text)
      ? "Olá! Sou o assistente de atendimento da imobiliária. Que tipo de imóvel você procura e em qual cidade?"
      : "Entendi. Para te ajudar melhor, qual tipo de imóvel você procura (casa, apartamento, terreno) e em qual região?";
    awaiting = "interesse";
  } else if (!next.purpose) {
    reply = u.interest ? "Olá! Posso ajudar. Você procura o imóvel para morar ou investir?" : "Você procura o imóvel para morar ou investir?";
    awaiting = "finalidade";
  } else if (!next.name) {
    reply = "Entendi. Qual é o seu nome?";
    awaiting = "nome";
  } else if (!next.address && !skippedAddress && client.awaiting !== null && !(client.status === "qualificado")) {
    reply = `Prazer, ${first}! Para registrar seu atendimento, poderia informar seu endereço ou bairro atual?`;
    awaiting = "endereco";
  } else if (client.status !== "qualificado") {
    reply = `Obrigado, ${first}! Registrei seu interesse em ${next.interest!.toLowerCase()} para ${next.purpose!.toLowerCase()}. Um corretor vai separar opções e retornar por aqui em breve.`;
    u.status = "qualificado";
  } else {
    reply = `Anotado, ${first}! Vou repassar ao corretor responsável pelo seu atendimento.`;
  }
  u.awaiting = awaiting;
  if (!u.status) u.status = client.status === "qualificado" ? "qualificado" : "aguardando_cliente";
  skippedAddress = false;
  return { updates: u, reply };
}

export function buildSummary(c: Client): string {
  if (c.messages.length === 0) return "Sem mensagens registradas.";
  const parts: string[] = [];
  parts.push(c.name ? `${c.name} entrou em contato pelo WhatsApp` : "Contato não identificado iniciou conversa pelo WhatsApp");
  if (c.interest) parts.push(`buscando ${c.interest.toLowerCase()}`);
  let s = parts.join(", ") + ".";
  if (c.purpose) s += ` Finalidade: ${c.purpose.toLowerCase()}.`;
  if (c.address) s += ` Informou endereço: ${c.address}.`;
  const missing = [!c.name && "nome", !c.interest && "interesse", !c.purpose && "finalidade", !c.address && "endereço"].filter(Boolean);
  if (missing.length) s += ` Pendente: ${missing.join(", ")}.`;
  s += c.status === "qualificado" ? " Cliente qualificado para contato do corretor." : "";
  const n = c.messages.filter((m) => m.sender === "cliente").length;
  s += ` ${n} mensage${n === 1 ? "m" : "ns"} do cliente registradas.`;
  return s;
}
