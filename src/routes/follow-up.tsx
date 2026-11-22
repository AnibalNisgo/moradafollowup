import { createFileRoute, Link } from "@tanstack/react-router";
import { Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo/store";
import { computeFollowup } from "@/lib/demo/followup";
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

const order = { pendente: 0, programado: 1, concluido: 2 };

function FollowUp() {
  const { state, now, setFollowupDays, simulateFollowup } = useDemo();
  const rows = state.clients.map((c) => ({ c, f: computeFollowup(c, state.followupDays, now) }))
    .filter((r) => r.f).sort((a, b) => order[a.f!.status] - order[b.f!.status] || a.f!.scheduledAt.localeCompare(b.f!.scheduledAt));
  const answered = state.clients.length - rows.length;
  return (
    <div>
      <PageHeader title="Follow-up" desc="Retornos automáticos para clientes que não responderam ao atendimento." />
      <div className="space-y-6 p-5 md:p-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm leading-loose">
            <Clock className="size-4 text-primary" />Se o cliente não responder durante
            <Input type="number" min={1} max={30} value={state.followupDays} onChange={(e) => setFollowupDays(Number(e.target.value) || 1)} className="h-8 w-16 text-center tabular-nums" />
            dias após a última mensagem enviada pelo atendimento, programar uma mensagem de retorno.
          </div>
          <p className="mt-2 text-xs text-muted-foreground">O retorno é agendado no mesmo horário da última mensagem do atendimento. Se o cliente responder antes, o retorno pendente é cancelado automaticamente ({answered} {answered === 1 ? "conversa" : "conversas"} com resposta do cliente).</p>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              {["Cliente", "Último contato", "Dias sem resposta", "Retorno previsto", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {rows.map(({ c, f }) => (
                <tr key={c.id}>
                  <td className="px-4 py-3"><Link to="/clientes/$id" params={{ id: c.id }} className="flex items-center gap-2.5 font-medium hover:text-primary"><Avatar name={c.name} className="size-7" />{c.name ?? c.phone}</Link></td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtDateTime(f!.baseAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{f!.daysWithoutReply}</td>
                  <td className="px-4 py-3 tabular-nums">{f!.status === "concluido" ? <span className="text-muted-foreground">Enviado {fmtDateTime(f!.doneAt)}</span> : fmtDateTime(f!.scheduledAt)}</td>
                  <td className="px-4 py-3"><FollowPill s={f!.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {f!.status !== "concluido" && <Button size="sm" variant="outline" onClick={() => { simulateFollowup(c.id); toast.success(`Follow-up simulado para ${c.name ?? c.phone}`, { description: "Mensagem registrada no histórico. Nenhuma mensagem real foi enviada." }); }}><Send />Simular follow-up</Button>}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Todos os clientes responderam. Nenhum retorno necessário.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
