// src/lib/apiBase.js
export function apiUrl(path) {
  // Always relative so it works on Vercel and locally (dev proxy)
  if (!path.startsWith("/")) return `/api${path}`;
  // If caller already passed `/api/...`, keep it; otherwise prefix.
  return path.startsWith("/api") ? path : `/api${path}`;
}

export async function ensureOk(res) {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
}
