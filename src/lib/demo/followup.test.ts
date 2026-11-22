import { describe, expect, it } from "vitest";
import { computeFollowup } from "./followup";
import type { Client } from "./types";

const base: Client = { id: "x", name: null, phone: "1", address: null, interest: null, purpose: null, status: "novo", awaiting: null, messages: [] };
const at = "2026-01-10T14:37:00.000Z";

describe("regra de follow-up", () => {
  it("agenda retorno N dias após a última mensagem do atendimento, no mesmo horário", () => {
    const f = computeFollowup({ ...base, messages: [{ id: "1", sender: "assistente", text: "oi", at }] }, 3, Date.parse("2026-01-11T00:00:00Z"));
    expect(f?.scheduledAt).toBe("2026-01-13T14:37:00.000Z");
    expect(f?.status).toBe("programado");
  });
  it("cancela retorno se o cliente respondeu por último", () => {
    const f = computeFollowup({ ...base, messages: [{ id: "1", sender: "assistente", text: "oi", at }, { id: "2", sender: "cliente", text: "oi", at }] }, 3);
    expect(f).toBeNull();
  });
});
