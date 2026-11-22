import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Sparkles, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo/store";
import { computeFollowup } from "@/lib/demo/followup";
import { buildSummary } from "@/lib/demo/assistant";
import { fmtDateTime } from "@/lib/demo/format";
import { Avatar, Field, FollowPill, Panel, StatusPill } from "@/components/app/ui-bits";
import { MessageList } from "@/components/app/MessageList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/clientes/$id")({
  head: () => ({ meta: [
    { title: "Cadastro do cliente — Atende.IA" },
    { name: "description", content: "Dados, resumo do atendimento e histórico completo de mensagens do cliente." },
    { property: "og:title", content: "Cadastro do cliente — Atende.IA" },
    { property: "og:description", content: "Cadastro detalhado gerado pelo atendimento." },
  ] }),
  component: Detalhe,
});

const fields = [["name", "Nome"], ["phone", "Telefone"], ["address", "Endereço"], ["interest", "Interesse imobiliário"], ["purpose", "Finalidade"]] as const;

function Detalhe() {
  const { id } = Route.useParams();
  const { state, now, updateClient, real } = useDemo();
  const c = state.clients.find((x) => x.id === id);
  const [edit, setEdit] = useState<Record<string, string> | null>(null);
  if (!c) return <div className="p-8 text-sm">Cliente não encontrado. <Link to="/clientes" className="text-primary">Voltar</Link></div>;
  const f = computeFollowup(c, state.followupDays, now);
  const save = () => {
    const patch = Object.fromEntries(fields.map(([k]) => [k, edit![k]?.trim() || (k === "phone" ? c.phone : null)]));
    updateClient(c.id, patch); setEdit(null); toast.success("Cadastro atualizado");
  };
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link to="/clientes" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><ArrowLeft className="size-4" /></Link>
          <Avatar name={c.name} className="size-10" />
          <div><div className="flex items-center gap-2"><h1 className="text-lg font-semibold tracking-tight">{c.name ?? "Não informado"}</h1><StatusPill s={c.status} /></div><p className="text-sm tabular-nums text-muted-foreground">{c.phone}</p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild><Link to="/atendimentos" search={{ c: c.id }}><MessageCircle />Abrir conversa</Link></Button>
          {!real && <Button size="sm" onClick={() => setEdit(Object.fromEntries(fields.map(([k]) => [k, c[k] ?? ""])))}><Pencil />Editar dados</Button>}
        </div>
      </div>
      <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Dados cadastrais">
            <dl className="grid grid-cols-2 gap-4 p-4">
              <Field label="Nome" value={c.name} /><Field label="Telefone" value={c.phone} />
              <div className="col-span-2"><Field label="Endereço" value={c.address} /></div>
              <div className="col-span-2"><Field label="Contexto / interesse" value={[c.interest, c.purpose].filter(Boolean).join(" · ") || null} /></div>
              <Field label="Primeiro contato" value={c.messages[0] ? fmtDateTime(c.messages[0].at) : null} />
              <Field label="Último contato" value={c.messages.at(-1) ? fmtDateTime(c.messages.at(-1)!.at) : null} />
            </dl>
          </Panel>
          <Panel title="Resumo automático" action={<Sparkles className="size-3.5 text-primary" />}>
            <p className="p-4 text-sm leading-relaxed">{real ? c.summary ?? "Não informado" : buildSummary(c)}</p>
          </Panel>
          <Panel title="Próximo follow-up" action={<FollowPill s={f?.status ?? null} />}>
            <div className="p-4 text-sm">
              {!f ? <p className="text-muted-foreground">Nenhum retorno programado.</p>
                : f.status === "concluido" ? <p>Retorno enviado em <b className="font-medium">{fmtDateTime(f.doneAt)}</b>. Aguardando resposta.</p>
                : <p>Data programada <b className="font-medium">{fmtDateTime(f.scheduledAt)}</b></p>}
            </div>
          </Panel>
        </div>
        <Panel title={`Histórico de mensagens (${c.messages.length})`} className="overflow-hidden lg:col-span-3">
          <MessageList messages={c.messages} className="max-h-[70vh] overflow-y-auto" />
        </Panel>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar dados do cliente</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3">{fields.map(([k, l]) => (
            <div key={k} className="space-y-1"><Label htmlFor={k}>{l}</Label><Input id={k} value={edit[k] ?? ""} placeholder="Não informado" onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>
          ))}</div>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
