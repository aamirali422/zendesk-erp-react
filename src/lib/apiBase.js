// src/lib/apiBase.js
export function apiUrl(path) {
  // Normalize incoming path (with or without leading /)
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Ensure everything we call hits our backend prefix /api
  return clean.startsWith("/api") ? clean : `/api${clean}`;
}

// Reusable response guard
export async function ensureOk(res) {
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data?.error || `HTTP ${res.status}`);
    } catch {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
  }
  return res;
}
  