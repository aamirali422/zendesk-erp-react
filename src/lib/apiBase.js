// src/lib/apiBase.js

/**
 * Build an API URL that works in:
 * - Local dev: Vite proxies "/api" -> http://127.0.0.1:4000
 * - Vercel prod: serverless routes live at "/api"
 *
 * Usage: fetch(apiUrl('/api/login')), fetch(apiUrl('/api/zendesk?path=...')), etc.
 */
export function apiUrl(path = "/api") {
  // If absolute URL, return as-is (rare, but safe)
  if (/^https?:\/\//i.test(path)) return path;

  // Normalize to start with "/"
  const p = path.startsWith("/") ? path : `/${path}`;

  // If already points to our API namespace, use it
  if (p.startsWith("/api")) return p;

  // Otherwise prefix with "/api"
  return `/api${p}`;
}

/**
 * Ensure Response.ok, otherwise throw a friendly Error with server payload if present.
 */
export async function ensureOk(res) {
  if (res.ok) return res;

  let message = `HTTP ${res.status}`;
  try {
    const data = await res.json();
    if (typeof data === "string") {
      message = data;
    } else if (data?.error) {
      message = data.error;
    } else if (data?.message) {
      message = data.message;
    }
  } catch {
    // If response wasn't JSON, we keep the default message
  }
  throw new Error(message);
}
