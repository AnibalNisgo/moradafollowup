import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, MessageCircle, CalendarClock, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/atendimentos", label: "Atendimentos", icon: MessageCircle },
  { to: "/follow-up", label: "Follow-up", icon: CalendarClock },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { reset } = useDemo();
  const active = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
  const doReset = () => { if (confirm("Restaurar os dados iniciais da demonstração?")) { reset(); toast.success("Demonstração restaurada"); } };
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"><MessageCircle className="size-4" /></div>
          <span className="font-semibold tracking-tight">Atende<span className="text-primary">.IA</span></span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent", active(n.to) && "bg-sidebar-accent font-medium text-sidebar-accent-foreground")}>
              <n.icon className="size-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 rounded-md px-2.5 text-[11px] leading-relaxed text-muted-foreground">Ambiente de demonstração com dados fictícios.</div>
          <button onClick={doReset} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><RotateCcw className="size-3.5" />Restaurar demonstração</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
          <span className="font-semibold tracking-tight">Atende<span className="text-primary">.IA</span></span>
          <button onClick={doReset} className="flex items-center gap-1 text-xs text-muted-foreground"><RotateCcw className="size-3.5" />Restaurar</button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <nav className="grid grid-cols-4 border-t bg-sidebar md:hidden">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground", active(n.to) && "text-primary")}>
              <n.icon className="size-5" />{n.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
