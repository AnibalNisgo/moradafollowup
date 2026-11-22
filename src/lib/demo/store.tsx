import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { createSeed } from "./seed";
import { simulateReply } from "./assistant";
import { followupMessage } from "./followup";
import type { Client, DemoState, Message } from "./types";
import { toast } from "sonner";

// Repositório local (localStorage). Ponto único de troca futura por Supabase.
const KEY = "atendeia-demo-v1";
const LOCAL_MODE_KEY = "morada-console-real";
const LOCAL_API = "http://127.0.0.1:3002";
const EMPTY: DemoState = { clients: [], followupDays: 3 };
type ConsoleState = DemoState & { whatsapp: string };

async function localApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(LOCAL_API + path, {
    ...init,
    cache: "no-store",
    headers: { "X-Morada-Local": "1", ...init?.headers },
    signal: AbortSignal.timeout(7_000),
  });
  if (!response.ok) throw new Error("API local indisponível");
  return response.json() as Promise<T>;
}
let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(++seq).toString(36)}`;

interface Store {
  state: DemoState;
  now: number;
  sendClientMessage: (clientId: string, text: string) => Promise<void>;
  typing: string | null;
  updateClient: (id: string, patch: Partial<Client>) => void;
  createConversation: () => string;
  setFollowupDays: (d: number) => void;
  simulateFollowup: (id: string) => void;
  reset: () => void;
  real: boolean;
  local: boolean;
  setReal: (enabled: boolean) => void;
  whatsapp: string;
}
const Ctx = createContext<Store | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [now, setNow] = useState(0);
  const [typing, setTyping] = useState<string | null>(null);
  const [local, setLocal] = useState(false);
  const [real, setRealMode] = useState(false);
  const [realState, setRealState] = useState<ConsoleState | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let s: DemoState | null = null;
    try { const raw = localStorage.getItem(KEY); if (raw) s = JSON.parse(raw) as DemoState; } catch { /* ignore */ }
    setState(s ?? createSeed());
    const isLocal = ["http://localhost:8080", "http://127.0.0.1:8080"].includes(window.location.origin);
    setLocal(isLocal);
    setRealMode(isLocal && localStorage.getItem(LOCAL_MODE_KEY) === "1");
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (state) localStorage.setItem(KEY, JSON.stringify(state)); }, [state]);

  useEffect(() => {
    if (!real) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        const data = await localApi<ConsoleState>("/api/console");
        if (!active) return;
        setRealState(data);
        setUnavailable(false);
        setNow(Date.now());
      } catch {
        if (active) setUnavailable(true);
      } finally {
        if (active) timer = setTimeout(() => void refresh(), 4000);
      }
    };
    void refresh();
    return () => { active = false; clearTimeout(timer); };
  }, [real]);

  const mutate = useCallback((id: string, fn: (c: Client) => Client) =>
    setState((s) => s && { ...s, clients: s.clients.map((c) => (c.id === id ? fn(c) : c)) }), []);

  const sendClientMessage = useCallback(async (clientId: string, text: string) => {
    let snapshot: Client | undefined;
    const msg: Message = { id: uid("m"), sender: "cliente", text, at: new Date().toISOString() };
    setState((s) => {
      if (!s) return s;
      const clients = s.clients.map((c) => {
        if (c.id !== clientId) return c;
        snapshot = c;
        return { ...c, status: c.status === "qualificado" ? c.status : "em_atendimento", messages: [...c.messages, msg] } as Client;
      });
      return { ...s, clients };
    });
    setNow(Date.now());
    setTyping(clientId);
    await new Promise((r) => setTimeout(r, 900 + Math.min(text.length * 15, 900)));
    setState((s) => {
      if (!s) return s;
      return { ...s, clients: s.clients.map((c) => {
        if (c.id !== clientId) return c;
        const { updates, reply } = simulateReply(snapshot ?? c, text);
        return { ...c, ...updates, messages: [...c.messages, { id: uid("m"), sender: "assistente", text: reply, at: new Date().toISOString() }] };
      }) };
    });
    setTyping(null);
    setNow(Date.now());
  }, []);

  const createConversation = useCallback(() => {
    const id = uid("c");
    const phone = `(47) 9${String(8000 + Math.floor(Math.random() * 1999))}-${String(1000 + Math.floor(Math.random() * 8999))}`;
    setState((s) => s && { ...s, clients: [{ id, name: null, phone, address: null, interest: null, purpose: null, status: "novo", awaiting: null, messages: [] }, ...s.clients] });
    return id;
  }, []);

  const simulateFollowup = useCallback((id: string) => {
    mutate(id, (c) => ({ ...c, messages: [...c.messages, { id: uid("m"), sender: "assistente", kind: "followup", text: followupMessage(c), at: new Date().toISOString() }] }));
    setNow(Date.now());
  }, [mutate]);

  if (!state) return <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">Carregando demonstração…</div>;

  const value: Store = {
    state: real ? realState ?? EMPTY : state, now, typing, sendClientMessage, createConversation, simulateFollowup,
    real, local,
    whatsapp: unavailable ? "API local indisponível" : realState?.whatsapp ?? "consultando…",
    setReal: (enabled) => {
      if (!local) return;
      localStorage.setItem(LOCAL_MODE_KEY, enabled ? "1" : "0");
      setRealMode(enabled);
    },
    updateClient: (id, patch) => mutate(id, (c) => ({ ...c, ...patch })),
    setFollowupDays: (d) => {
      const followupDays = Math.max(1, Math.min(30, Math.trunc(d)));
      if (!real) {
        setState((s) => s && { ...s, followupDays });
        return;
      }
      void localApi<{ followupDays: number }>("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followupDays }),
      }).then((result) => {
        setRealState((s) => s && { ...s, ...result });
        toast.success("Prazo atualizado");
      }).catch(() => toast.error("Não foi possível gravar o prazo"));
    },
    reset: () => { setState(createSeed()); setNow(Date.now()); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDemo fora do DemoProvider");
  return v;
}
export const lastMessage = (c: Client) => c.messages[c.messages.length - 1];
export const lastContactAt = (c: Client) => lastMessage(c)?.at ?? null;
