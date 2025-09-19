// src/lib/zendesk.js
import { apiUrl, ensureOk } from "@/lib/apiBase";

/** Pass a Zendesk /api/v2 path (MUST start with /api/v2) */
export async function zdGet(path) {
  const res = await fetch(
    apiUrl(`/api/zendesk?path=${encodeURIComponent(path)}`),
    { credentials: "include" }
  );
  await ensureOk(res);
  return res.json();
}
