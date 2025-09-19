// src/lib/apiBase.js
export const API_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/+$/, "");

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}