import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { useDemo, lastContactAt } from "@/lib/demo/store";
import { computeFollowup } from "@/lib/demo/followup";
import { fmtDateTime, statusLabel } from "@/lib/demo/format";
import type { ClientStatus } from "@/lib/demo/types";
import { Avatar, FollowPill, PageHeader, StatusPill } from "@/components/app/ui-bits";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/clientes/")({
  head: () => ({ meta: [
    { title: "Clientes — Atende.IA" },
    { name: "description", content: "Clientes identificados automaticamente pelo atendimento via WhatsApp." },
    { property: "og:title", content: "Clientes — Atende.IA" },
    { property: "og:description", content: "Cadastro de clientes gerado pelo atendimento." },
  ] }),
  component: Clientes,
});

const ni = (v: string | null) => v ?? <span className="italic text-muted-foreground">Não informado</span>;

function Clientes() {
  const { state, now } = useDemo();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [st, setSt] = useState<ClientStatus | "todos">("todos");
  const list = state.clients
    .filter((c) => st === "todos" || c.status === st)
    .filter((c) => [c.name, c.phone, c.address, c.interest].join(" ").toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (lastContactAt(b) ?? "").localeCompare(lastContactAt(a) ?? ""));
  return (
    <div>
      <PageHeader title="Clientes" desc={`${state.clients.length} clientes identificados pelo atendimento`} />
      <div className="space-y-4 p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-72"><Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, telefone, interesse…" className="bg-card pl-8" /></div>
          <div className="flex flex-wrap gap-1">
            {(["todos", "novo", "em_atendimento", "aguardando_cliente", "qualificado"] as const).map((s) => (
              <button key={s} onClick={() => setSt(s)} className={cn("rounded-md border px-2.5 py-1 text-xs", st === s ? "border-primary bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:text-foreground")}>{s === "todos" ? "Todos" : statusLabel[s]}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b text-left text-xs text-muted-foreground">
              {["Cliente", "Telefone", "Endereço", "Interesse", "Último contato", "Status", "Próximo follow-up"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y">
              {list.map((c) => { const f = computeFollowup(c, state.followupDays, now); return (
                <tr key={c.id} onClick={() => nav({ to: "/clientes/$id", params: { id: c.id } })} className="cursor-pointer hover:bg-muted/60">
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Avatar name={c.name} className="size-7" /><span className="font-medium">{ni(c.name)}</span></div></td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{c.phone}</td>
                  <td className="max-w-48 truncate px-4 py-3">{ni(c.address)}</td>
                  <td className="max-w-56 truncate px-4 py-3">{ni(c.interest)}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{fmtDateTime(lastContactAt(c))}</td>
                  <td className="px-4 py-3"><StatusPill s={c.status} /></td>
                  <td className="px-4 py-3"><div className="flex flex-col gap-0.5"><FollowPill s={f?.status ?? null} />{f && f.status !== "concluido" && <span className="text-[11px] tabular-nums text-muted-foreground">{fmtDateTime(f.scheduledAt)}</span>}</div></td>
                </tr>); })}
              {list.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
