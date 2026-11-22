import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo/store";
import { computeFollowup, storedFollowupInfo } from "@/lib/demo/followup";
import { fmtDateTime } from "@/lib/demo/format";
import { Avatar, FollowPill, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/follow-up")({
  head: () => ({ meta: [
    { title: "Follow-up — Atende.IA" },
    { name: "description", content: "Retornos automáticos para clientes sem resposta, no mesmo horário da última mensagem." },
    { property: "og:title", content: "Follow-up — Atende.IA" },
    { property: "og:description", content: "Regra configurável de retorno automático." },
  ] }),
  component: FollowUp,
});

const order = { pendente: 0, enviando: 1, programado: 2, concluido: 3, falhou: 4, cancelado: 5 };

function FollowUp() {
  const { state, now, setFollowupDays, simulateFollowup, real } = useDemo();
  const [draft, setDraft] = useState<string | null>(null);
  const rows = state.clients.flatMap((c) => {
    if (real) return (c.followups ?? []).map((row) => ({ id: row.id, c, f: storedFollowupInfo(row, now) }));
    const f = computeFollowup(c, state.followupDays, now);
    return f ? [{ id: c.id, c, f }] : [];
  }).sort((a, b) => order[a.f.status] - order[b.f.status] || a.f.scheduledAt.localeCompare(b.f.scheduledAt));
  return (
    <div>
      <PageHeader title="Follow-up" desc="Retornos automáticos para clientes que não responderam ao atendimento." />
      <div className="space-y-6 p-5 md:p-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm leading-loose">
            <Clock className="size-4 text-primary" />Se o cliente não responder durante
            <Input type="number" min={1} max={30} aria-label="Prazo de follow-up em dias" value={real ? draft ?? state.followupDays : state.followupDays}
              onChange={(e) => real ? setDraft(e.target.value) : setFollowupDays(Number(e.target.value) || 1)}
              onBlur={(e) => {
                if (real && draft !== null && e.target.validity.valid && draft.trim() && Number(draft) !== state.followupDays) setFollowupDays(Number(draft));
                setDraft(null);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              className="h-8 w-16 text-center tabular-nums" />
            dias após a última mensagem enviada pelo atendimento, programar uma mensagem de retorno.
          </div>
          <p className="mt-2 text-xs text-muted-foreground">O retorno é agendado no mesmo horário da última mensagem do atendimento. Se o cliente responder antes, o retorno pendente é cancelado automaticamente.</p>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              {["Cliente", "Último contato", "Dias sem resposta", "Retorno previsto", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {rows.map(({ id, c, f }) => (
                <tr key={id}>
                  <td className="px-4 py-3"><Link to="/clientes/$id" params={{ id: c.id }} className="flex items-center gap-2.5 font-medium hover:text-primary"><Avatar name={c.name} className="size-7" />{c.name ?? c.phone}</Link></td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtDateTime(f!.baseAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{f!.daysWithoutReply}</td>
                  <td className="px-4 py-3 tabular-nums">{f!.status === "concluido" ? <span className="text-muted-foreground">Enviado {fmtDateTime(f!.doneAt)}</span> : fmtDateTime(f!.scheduledAt)}</td>
                  <td className="px-4 py-3"><FollowPill s={f!.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {!real && f.status !== "concluido" && <Button size="sm" variant="outline" onClick={() => { simulateFollowup(c.id); toast.success(`Follow-up simulado para ${c.name ?? c.phone}`, { description: "Mensagem registrada no histórico. Nenhuma mensagem real foi enviada." }); }}><Send />Simular follow-up</Button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum retorno encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
