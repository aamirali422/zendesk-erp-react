// src/lib/zendesk.js
import { apiUrl, ensureJson } from "@/lib/apiBase";

/** Pass a Zendesk /api/v2 path (MUST start with /api/v2) */
export async function zdGet(path) {
  const res = await fetch(
    apiUrl(`/zendesk?path=${encodeURIComponent(path)}`),
    { credentials: "include" }
  );
  return ensureJson(res);
}
