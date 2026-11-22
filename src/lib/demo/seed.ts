import type { Client, DemoState, Message } from "./types";

const H = 3_600_000;
// Gera dados relativos ao momento atual (chamado de forma preguiçosa, nunca no escopo do módulo).
export function createSeed(now = Date.now()): DemoState {
  let n = 0;
  const conv = (startHoursAgo: number, lines: [("c" | "a"), string, number?][]): Message[] => {
    let t = now - startHoursAgo * H;
    return lines.map(([s, text, gapMin = 2]) => {
      t += gapMin * 60_000;
      return { id: `m${++n}`, sender: s === "c" ? "cliente" : "assistente", text, at: new Date(t).toISOString() };
    });
  };
  const clients: Client[] = [
    { id: "c1", name: "Mariana Costa", phone: "(47) 99812-3401", address: "Rua das Palmeiras, 210 — Joinville/SC", interest: "Casa em Itapoá, próximo à praia", purpose: "Moradia", status: "qualificado", awaiting: null,
      messages: conv(26, [["c", "Olá, estou procurando uma casa em Itapoá."], ["a", "Olá! Posso ajudar. Você procura uma casa para morar ou investir?", 1], ["c", "Para morar, próximo à praia."], ["a", "Entendi. Qual é o seu nome?", 1], ["c", "Mariana Costa"], ["a", "Prazer, Mariana! Para registrar seu atendimento, poderia informar seu endereço ou bairro atual?", 1], ["c", "Moro na Rua das Palmeiras, 210 — Joinville/SC"], ["a", "Obrigado, Mariana! Registrei seu interesse em casa em itapoá, próximo à praia para moradia. Um corretor vai separar opções e retornar por aqui em breve.", 1]]) },
    { id: "c2", name: "Ricardo Almeida", phone: "(41) 98877-1290", address: null, interest: "Apartamento em Curitiba, 2 quartos", purpose: "Investimento", status: "aguardando_cliente", awaiting: "endereco",
      messages: conv(100, [["c", "Bom dia, quero um apartamento em Curitiba de 2 quartos"], ["a", "Olá! Posso ajudar. Você procura o imóvel para morar ou investir?", 1], ["c", "Investir, para alugar"], ["a", "Entendi. Qual é o seu nome?", 1], ["c", "Ricardo Almeida"], ["a", "Prazer, Ricardo! Para registrar seu atendimento, poderia informar seu endereço ou bairro atual?", 1]]) },
    { id: "c3", name: "Fernanda Ribeiro", phone: "(47) 99101-4477", address: "Bairro Itacolomi — Balneário Piçarras/SC", interest: "Terreno em Penha", purpose: "Moradia", status: "qualificado", awaiting: null,
      messages: conv(6, [["c", "Oi! Vocês têm terreno em Penha?"], ["a", "Olá! Posso ajudar. Você procura o imóvel para morar ou investir?", 1], ["c", "Quero construir para morar"], ["a", "Entendi. Qual é o seu nome?", 1], ["c", "Fernanda Ribeiro"], ["a", "Prazer, Fernanda! Para registrar seu atendimento, poderia informar seu endereço ou bairro atual?", 1], ["c", "Bairro Itacolomi — Balneário Piçarras/SC"], ["a", "Obrigado, Fernanda! Registrei seu interesse em terreno em penha para moradia. Um corretor vai separar opções e retornar por aqui em breve.", 1], ["c", "Perfeito, aguardo!", 30]]) },
    { id: "c4", name: null, phone: "(11) 97456-2033", address: null, interest: "Apartamento em Balneário Camboriú", purpose: null, status: "aguardando_cliente", awaiting: "finalidade",
      messages: conv(52, [["c", "Quanto custa um apartamento em Balneário Camboriú?"], ["a", "Olá! Posso ajudar. Você procura o imóvel para morar ou investir?", 1]]) },
    { id: "c5", name: "João Pedro Santos", phone: "(47) 98823-5560", address: null, interest: "Casa em Itapoá, 3 quartos", purpose: "Temporada", status: "aguardando_cliente", awaiting: "endereco",
      messages: conv(120, [["c", "Procuro casa em Itapoá com 3 quartos para temporada"], ["a", "Entendi. Qual é o seu nome?", 1], ["c", "Meu nome é João Pedro Santos"], ["a", "Prazer, João! Para registrar seu atendimento, poderia informar seu endereço ou bairro atual?", 1], ["a", "Olá, João! Passando para saber se ainda tem interesse sobre casa em itapoá, 3 quartos. Posso separar algumas opções para você?", 72 * 60]]).map((m, i, arr) => i === arr.length - 1 ? { ...m, kind: "followup" as const } : m) },
    { id: "c6", name: "Patrícia Moura", phone: "(47) 99634-8812", address: "Centro — São Francisco do Sul/SC", interest: "Sobrado em São Francisco do Sul", purpose: "Moradia", status: "em_atendimento", awaiting: null,
      messages: conv(2, [["c", "Olá, meu nome é Patrícia Moura, procuro sobrado em São Francisco do Sul"], ["a", "Olá, Patrícia! Você procura o imóvel para morar ou investir?", 1], ["c", "Para morar. Moro no Centro — São Francisco do Sul/SC"]]) },
    { id: "c7", name: "Eduardo Lima", phone: "(48) 99120-7745", address: null, interest: null, purpose: null, status: "aguardando_cliente", awaiting: "interesse",
      messages: conv(30, [["c", "Boa tarde"], ["a", "Olá! Sou o assistente de atendimento da imobiliária. Que tipo de imóvel você procura e em qual cidade?", 1]]) },
    { id: "c8", name: "Camila Duarte", phone: "(47) 98450-6631", address: "Rua XV de Novembro, 88 — Blumenau/SC", interest: "Apartamento em Itajaí, próximo à praia", purpose: "Investimento", status: "qualificado", awaiting: null,
      messages: conv(80, [["c", "Oi, sou a Camila Duarte. Quero investir num apartamento em Itajaí perto da praia"], ["a", "Prazer, Camila! Para registrar seu atendimento, poderia informar seu endereço ou bairro atual?", 1], ["c", "Rua XV de Novembro, 88 — Blumenau/SC"], ["a", "Obrigado, Camila! Registrei seu interesse em apartamento em itajaí, próximo à praia para investimento. Um corretor vai separar opções e retornar por aqui em breve.", 1]]) },
  ];
  return { clients, followupDays: 3 };
}
