// src/lib/apiBase.js
export function apiUrl(path) {
  if (!path.startsWith("/")) return `/api${path}`;
  return path.startsWith("/api") ? path : `/api${path}`;
}

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

// (Optional) if any old code still imports ensureOk:
export async function ensureOk(res) {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
}
