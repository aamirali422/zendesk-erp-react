// src/lib/apiBase.js
export function apiUrl(path) {
  if (!path.startsWith("/")) return `/api${path}`;
  return path.startsWith("/api") ? path : `/api${path}`;
}

// Core JSON guard that returns parsed JSON or throws rich errors
export async function ensureJson(res) {
  if (!res.ok) {
    try {
      const data = await res.clone().json();
      const detail = data?.error || data?.message || JSON.stringify(data);
      throw new Error(detail || `HTTP ${res.status}`);
    } catch {
      try {
        const txt = await res.clone().text();
        throw new Error(txt || `HTTP ${res.status}`);
      } catch {
        throw new Error(`HTTP ${res.status}`);
      }
    }
  }
  return res.json();
}

// Back-compat alias (some files import ensureOk)
export async function ensureOk(res) {
  return ensureJson(res);
}
