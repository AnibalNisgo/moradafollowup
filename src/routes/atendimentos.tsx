import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, SendHorizontal, Sparkles, Info } from "lucide-react";
import { useDemo, lastMessage } from "@/lib/demo/store";
import { computeFollowup } from "@/lib/demo/followup";
import { buildSummary } from "@/lib/demo/assistant";
import { fmtDateTime, fmtShort } from "@/lib/demo/format";
import { Avatar, Field, FollowPill, StatusPill } from "@/components/app/ui-bits";
import { MessageList } from "@/components/app/MessageList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/atendimentos")({
  validateSearch: (s: Record<string, unknown>): { c?: string } => (typeof s["c"] === "string" ? { c: s["c"] } : {}),
  head: () => ({ meta: [
    { title: "Central de atendimentos — Atende.IA" },
    { name: "description", content: "Conversas do WhatsApp com extração automática dos dados do cliente." },
    { property: "og:title", content: "Central de atendimentos — Atende.IA" },
    { property: "og:description", content: "Simulação interativa de atendimento imobiliário." },
  ] }),
  component: Central,
});

const SUGESTOES = ["Olá, estou procurando uma casa em Itapoá.", "Para morar, próximo à praia.", "Meu nome é Lucas Andrade", "Moro na Rua Mar Azul, 45 — Itapoá/SC"];

function Central() {
  const { state, now, typing, sendClientMessage, createConversation, real } = useDemo();
  const { c: sel } = Route.useSearch();
  const nav = useNavigate({ from: "/atendimentos" });
  const [text, setText] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const sorted = [...state.clients].sort((a, b) => (lastMessage(b)?.at ?? "9").localeCompare(lastMessage(a)?.at ?? "9"));
  const c = state.clients.find((x) => x.id === sel);
  const select = (id?: string) => nav({ search: id ? { c: id } : {} });
  const send = (t = text) => { if (!c || !t.trim() || typing) return; void sendClientMessage(c.id, t.trim()); setText(""); };
  const f = c ? computeFollowup(c, state.followupDays, now) : null;

  return (
    <div className="flex h-full">
      <aside className={cn("w-full shrink-0 flex-col border-r bg-card md:flex md:w-80", c ? "hidden" : "flex")}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h1 className="text-sm font-semibold">Conversas</h1>
          {!real && <Button size="sm" variant="outline" onClick={() => select(createConversation())}><Plus />Nova conversa</Button>}
        </div>
        <ul className="flex-1 divide-y overflow-y-auto">
          {sorted.map((x) => { const l = lastMessage(x); return (
            <li key={x.id}><button onClick={() => select(x.id)} className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/60", x.id === sel && "bg-accent")}>
              <Avatar name={x.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium">{x.name ?? x.phone}</span><span className="text-[11px] text-muted-foreground">{l ? fmtShort(l.at) : "Agora"}</span></div>
                <p className="truncate text-xs text-muted-foreground">{typing === x.id ? "digitando…" : l ? `${l.sender === "assistente" ? "Assistente: " : ""}${l.text}` : "Sem mensagens"}</p>
                <div className="mt-1"><StatusPill s={x.status} /></div>
              </div>
            </button></li>); })}
        </ul>
      </aside>

      {c ? (
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b bg-card px-4 py-2.5">
            <button className="md:hidden" onClick={() => select()}><ArrowLeft className="size-4" /></button>
            <Avatar name={c.name} />
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{c.name ?? "Contato não identificado"}</div><div className="text-xs tabular-nums text-muted-foreground">{c.phone} · WhatsApp</div></div>
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted xl:hidden" onClick={() => setShowInfo(!showInfo)}><Info className="size-4" /></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto bg-chat-bg"><MessageList messages={c.messages} typing={typing === c.id} /></div>
          {!real && <div className="border-t bg-card p-3">
            <div className="mb-2 flex gap-1.5 overflow-x-auto">
              {SUGESTOES.map((s) => <button key={s} onClick={() => send(s)} className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary">{s}</button>)}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite como se fosse o cliente…" />
              <Button type="submit" size="icon" disabled={!text.trim() || !!typing}><SendHorizontal /></Button>
            </form>
            <p className="mt-1.5 text-[11px] text-muted-foreground">Simulação: respostas pré-configuradas, nenhuma mensagem é enviada.</p>
          </div>}
        </section>
      ) : (
        <div className="hidden flex-1 items-center justify-center bg-chat-bg text-sm text-muted-foreground md:flex">{real ? "Selecione uma conversa." : "Selecione uma conversa ou inicie uma nova."}</div>
      )}

      {c && (
        <aside className={cn("w-80 shrink-0 overflow-y-auto border-l bg-card", showInfo ? "fixed inset-y-0 right-0 z-40 shadow-xl xl:static xl:shadow-none" : "hidden xl:block")}>
          <div className="flex items-center justify-between border-b px-4 py-3"><h2 className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-3.5 text-primary" />Dados extraídos</h2>
            <button className="text-xs text-muted-foreground xl:hidden" onClick={() => setShowInfo(false)}>Fechar</button></div>
          <dl className="space-y-4 p-4">
            <Field label="Identificação" value={c.name} />
            <Field label="Telefone" value={c.phone} />
            <Field label="Endereço" value={c.address} />
            <Field label="Interesse" value={[c.interest, c.purpose].filter(Boolean).join(" · ") || null} />
            <div><dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Resumo do atendimento</dt><dd className="mt-1 rounded-md bg-muted p-2.5 text-xs leading-relaxed">{real ? c.summary ?? "Não informado" : buildSummary(c)}</dd></div>
            <Field label="Última interação" value={c.messages.at(-1) ? fmtDateTime(c.messages.at(-1)!.at) : null} />
            <div><dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Próximo follow-up</dt>
              <dd className="mt-1 space-y-1 text-sm"><FollowPill s={f?.status ?? null} />
                <p className="text-xs text-muted-foreground">{!f ? "Nenhum retorno programado." : f.status === "concluido" ? `Enviado em ${fmtDateTime(f.doneAt)}` : fmtDateTime(f.scheduledAt)}</p></dd></div>
          </dl>
        </aside>
      )}
    </div>
  );
}
