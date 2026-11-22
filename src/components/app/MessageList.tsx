import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, CalendarClock } from "lucide-react";
import type { Message } from "@/lib/demo/types";
import { fmtTime } from "@/lib/demo/format";
import { cn } from "@/lib/utils";

export function MessageList({ messages, typing, className }: { messages: Message[]; typing?: boolean; className?: string }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [messages.length, typing]);
  let lastDay = "";
  return (
    <div className={cn("flex flex-col gap-1.5 bg-chat-bg p-4", className)}>
      {messages.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma mensagem ainda. Digite abaixo como se fosse o cliente.</p>}
      {messages.map((m) => {
        const day = format(new Date(m.at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        const sep = day !== lastDay; lastDay = day;
        const mine = m.sender === "assistente";
        return (
          <div key={m.id} className="contents">
            {sep && <div className="my-2 self-center rounded-full bg-card px-3 py-0.5 text-[11px] text-muted-foreground shadow-sm">{day}</div>}
            <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm", mine ? "self-end bg-bubble-assistant" : "self-start bg-bubble-client")}>
              <div className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                {mine ? (m.kind === "followup" ? <><CalendarClock className="size-3" />Follow-up automático</> : <><Bot className="size-3" />Assistente</>) : "Cliente"}
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              <div className="mt-0.5 text-right text-[10px] text-muted-foreground">{fmtTime(m.at)}</div>
            </div>
          </div>
        );
      })}
      {typing && <div className="self-end rounded-lg bg-bubble-assistant px-3 py-2 text-xs text-muted-foreground shadow-sm">Assistente digitando…</div>}
      <div ref={end} />
    </div>
  );
}
