async function rest(table, query = {}, { method = "GET", body, prefer } = {}) {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error("Configuração do Supabase ausente");
  }

  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  url.search = new URLSearchParams(query).toString();
  const headers = { apikey: SUPABASE_SECRET_KEY };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(`Supabase ${table}: HTTP ${response.status}${data.code ? ` (${data.code})` : ""}`);
  }
  return response.status === 204 ? undefined : response.json();
}

async function saveMessage(message) {
  const [row] = await rest("messages", { on_conflict: "id" }, {
    method: "POST",
    body: message,
    prefer: "resolution=ignore-duplicates,return=representation"
  });
  return row ?? null;
}

function recentMessages(clientId, limit = 12) {
  return rest("messages", {
    client_id: `eq.${clientId}`,
    order: "sent_at.desc,id.desc",
    limit: String(limit)
  });
}

module.exports = { rest, saveMessage, recentMessages };
