import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, MessagesSquare, Hourglass, CalendarClock, ArrowRight } from "lucide-react";
import { useDemo, lastMessage } from "@/lib/demo/store";
import { computeFollowup } from "@/lib/demo/followup";
import { fmtDateTime, fmtShort, NI } from "@/lib/demo/format";
import { Avatar, FollowPill, PageHeader, Panel, StatusPill } from "@/components/app/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Visão geral — Atende.IA" },
    { name: "description", content: "Indicadores de atendimento, follow-ups programados e clientes com retorno pendente." },
    { property: "og:title", content: "Visão geral — Atende.IA" },
    { property: "og:description", content: "Painel do atendimento imobiliário via WhatsApp." },
  ] }),
  component: Dashboard,
});

function Dashboard() {
  const { state, now } = useDemo();
  const rows = state.clients.map((c) => ({ c, f: computeFollowup(c, state.followupDays, now), last: lastMessage(c) }));
  const recent = rows.filter((r) => r.last).sort((a, b) => b.last!.at.localeCompare(a.last!.at)).slice(0, 6);
  const upcoming = rows.filter((r) => r.f?.status === "programado").sort((a, b) => a.f!.scheduledAt.localeCompare(b.f!.scheduledAt));
  const pending = rows.filter((r) => r.f?.status === "pendente");
  const kpis = [
    { label: "Clientes cadastrados", value: state.clients.length, icon: Users },
    { label: "Atendimentos realizados", value: rows.filter((r) => r.c.messages.some((m) => m.sender === "assistente")).length, icon: MessagesSquare },
    { label: "Aguardando resposta do cliente", value: rows.filter((r) => r.f && ["pendente", "programado", "enviando"].includes(r.f.status)).length, icon: Hourglass },
    { label: "Follow-ups programados", value: upcoming.length, icon: CalendarClock },
  ];
  return (
    <div>
      <PageHeader title="Visão geral" desc="Resumo do atendimento automático e dos retornos programados." />
      <div className="space-y-6 p-5 md:p-8">
        <div className="grid grid-cols-2 divide-border overflow-hidden rounded-lg border bg-card lg:grid-cols-4 lg:divide-x">
          {kpis.map((k) => (
            <div key={k.label} className="border-b p-4 lg:border-b-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><k.icon className="size-3.5" />{k.label}</div>
              <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{k.value}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <Panel title="Atendimentos recentes" className="lg:col-span-3" action={<Link to="/atendimentos" search={{}} className="flex items-center gap-1 text-xs text-primary">Abrir central<ArrowRight className="size-3" /></Link>}>
            <ul className="divide-y">
              {recent.map(({ c, last }) => (
                <li key={c.id}>
                  <Link to="/clientes/$id" params={{ id: c.id }} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="truncate text-sm font-medium">{c.name ?? c.phone}</span><StatusPill s={c.status} /></div>
                      <p className="truncate text-xs text-muted-foreground">{c.interest ?? NI} · {last!.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{fmtShort(last!.at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <div className="space-y-6 lg:col-span-2">
            <Panel title="Próximos follow-ups" action={<Link to="/follow-up" className="text-xs text-primary">Ver todos</Link>}>
              {upcoming.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum retorno programado.</p> : (
                <ul className="divide-y">{upcoming.map(({ c, f }) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="truncate">{c.name ?? c.phone}</span><span className="text-xs tabular-nums text-muted-foreground">{fmtDateTime(f!.scheduledAt)}</span>
                  </li>))}</ul>)}
            </Panel>
            <Panel title="Clientes com retorno pendente">
              {pending.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Nenhum retorno pendente.</p> : (
                <ul className="divide-y">{pending.map(({ c, f }) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="truncate">{c.name ?? c.phone}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">{f!.daysWithoutReply} dias<FollowPill s="pendente" /></span>
                  </li>))}</ul>)}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
