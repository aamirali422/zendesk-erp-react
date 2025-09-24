// src/lib/apiBase.js
export function apiUrl(path) {
  if (!path.startsWith("/")) return `/api${path}`;
  return path.startsWith("/api") ? path : `/api${path}`;
}

export async function ensureJson(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const data = await res.clone().json();
      detail = data?.error || data?.message || detail;
    } catch {
      try {
        const txt = await res.clone().text();
        if (txt) detail = txt;
      } catch {}
    }
    throw new Error(detail);
  }
  return res.json();
}
