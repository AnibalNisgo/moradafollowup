import { cn } from "@/lib/utils";
import { followLabel, initials, statusLabel } from "@/lib/demo/format";
import type { ClientStatus, FollowupStatus } from "@/lib/demo/types";
import type { ReactNode } from "react";

const tone = {
  neutral: "bg-secondary text-secondary-foreground",
  primary: "bg-accent text-accent-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
} as const;

export function Pill({ t = "neutral", children }: { t?: keyof typeof tone; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", tone[t])}>{children}</span>;
}
export function StatusPill({ s }: { s: ClientStatus }) {
  const t = s === "qualificado" ? "success" : s === "em_atendimento" ? "primary" : s === "aguardando_cliente" ? "warning" : "neutral";
  return <Pill t={t}><span className="size-1.5 rounded-full bg-current" />{statusLabel[s]}</Pill>;
}
export function FollowPill({ s }: { s: FollowupStatus | null }) {
  if (!s) return <Pill>Sem retorno</Pill>;
  return <Pill t={s === "concluido" ? "success" : s === "pendente" ? "warning" : "primary"}>{followLabel[s]}</Pill>;
}
export function Avatar({ name, className }: { name: string | null; className?: string }) {
  return <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground", className)}>{initials(name)}</div>;
}
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b px-5 py-5 md:px-8">
      <div><h1 className="text-lg font-semibold tracking-tight">{title}</h1>{desc && <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>}</div>
      {actions}
    </div>
  );
}
export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card", className)}>
      <header className="flex items-center justify-between border-b px-4 py-3"><h2 className="text-sm font-medium">{title}</h2>{action}</header>
      {children}
    </section>
  );
}
export function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("mt-0.5 text-sm", !value && "italic text-muted-foreground")}>{value || "Não informado"}</dd>
    </div>
  );
}
