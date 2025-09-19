// src/lib/zendesk.js
import { apiUrl, ensureOk } from "./apiBase";

/** Proxy GET to Zendesk: pass a Zendesk path like "/api/v2/tickets.json?per_page=50" */
export async function zdGet(zdPath) {
  const url = apiUrl(`/zendesk?path=${encodeURIComponent(zdPath)}`);
  const res = await fetch(url, { credentials: "include" });
  await ensureOk(res);
  return res.json();
}
