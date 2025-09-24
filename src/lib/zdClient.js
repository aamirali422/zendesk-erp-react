// src/lib/zdClient.js
import { apiUrl } from "@/lib/apiBase";

/**
 * Read the response body EXACTLY ONCE.
 * - Always read as text first (so we can include it in error messages)
 * - If OK and looks like JSON, parse it; otherwise return {} or raw text if needed
 */
async function readOnce(res, { parseJson = true } = {}) {
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    // Truncate to avoid huge logs
    const snippet = text ? ` – ${text.slice(0, 400)}` : "";
    throw new Error(`HTTP ${res.status}${snippet}`);
  }

  if (!parseJson) return text || "";

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch (_e) {
      // Fall back with a helpful error
      throw new Error("Response was not valid JSON.");
    }
  }

  // Non-JSON success with empty body -> return {}
  if (!text) return {};
  // If you prefer to expose text on non-json, you could return { text } instead.
  throw new Error("Expected JSON but received non-JSON response.");
}

/**
 * Core request helper. Never read the body more than once.
 */
async function request(path, { method = "GET", headers = {}, body, credentials = "include", parseJson = true } = {}) {
  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body,
    credentials,
  });
  return readOnce(res, { parseJson });
}

/* ========== AUTH ========== */

export async function login({ email, token, subdomain }) {
  return request("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, subdomain }),
  });
}

export async function getSession() {
  return request("/api/session");
}

export async function logout() {
  return request("/api/logout", { method: "POST" });
}

/* ========== TICKETS / COMMENTS ========== */

export async function getTicket(id) {
  return request(`/api/tickets/${encodeURIComponent(id)}`);
}

export async function listComments(id) {
  return request(`/api/tickets/${encodeURIComponent(id)}/comments`);
}

export async function updateTicket(id, ticketPatch) {
  return request(`/api/tickets/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: ticketPatch }),
  });
}

export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  const fd = new FormData();
  // Ensure Zendesk always receives a non-empty body
  fd.append("body", (body || "").trim() || "Attachment(s) uploaded.");
  fd.append("isPublic", String(!!isPublic));
  if (html_body) fd.append("html_body", html_body);
  for (const f of files) fd.append("files", f);

  // DO NOT set Content-Type manually for FormData; the browser will set the multipart boundary.
  return request(`/api/tickets/${encodeURIComponent(id)}/comment`, {
    method: "POST",
    body: fd,
  });
}
