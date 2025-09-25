// src/lib/zdClient.js
import { apiUrl } from "@/lib/apiBase";

/**
 * Read the response body exactly once.
 * - Always read as text first, then decide JSON vs error.
 */
async function readOnce(res, { parseJson = true } = {}) {
  const text = await res.text().catch(() => "");

  if (!res.ok) {
    const snippet = text ? ` – ${text.slice(0, 400)}` : "";
    throw new Error(`HTTP ${res.status}${snippet}`);
  }

  if (!parseJson) return text || "";

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Response was not valid JSON.");
    }
  }

  // Non-JSON success:
  if (!text) return {};
  throw new Error("Expected JSON but received non-JSON response.");
}

/**
 * Core fetch helper for your app API.
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

/* ========= AUTH ========= */

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

/* ========= ZENDESK (via /api/zendesk proxy) =========
   We avoid /api/tickets/... pages that may not exist on Vercel,
   and go through the known-good proxy you already deployed.
*/

export async function getTicket(id) {
  const path = `/api/zendesk?path=${encodeURIComponent(
    `/api/v2/tickets/${encodeURIComponent(id)}.json?include=users,organizations,groups`
  )}`;
  return request(path);
}

export async function listComments(id) {
  const path = `/api/zendesk?path=${encodeURIComponent(
    `/api/v2/tickets/${encodeURIComponent(id)}/comments.json?include=users`
  )}`;
  return request(path);
}

export async function updateTicket(id, ticketPatch) {
  const path = `/api/zendesk?path=${encodeURIComponent(
    `/api/v2/tickets/${encodeURIComponent(id)}.json`
  )}`;
  return request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: ticketPatch }),
  });
}

/**
 * POST a new comment (public or internal) with optional attachments.
 *
 * For attachments, you need a server endpoint that:
 *  1) uploads each file to Zendesk Uploads API to get tokens,
 *  2) PUTs the ticket with the comment+tokens.
 *
 * If you already have /api/tickets/:id/comment working locally via Express,
 * mirror that as a Vercel Function at /api/tickets/[id]/comment.js.
 *
 * Below we keep the client code calling that route.
 */
export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  const fd = new FormData();
  // Ensure Zendesk receives a non-empty body
  fd.append("body", (body || "").trim() || "Attachment(s) uploaded.");
  fd.append("isPublic", String(!!isPublic));
  if (html_body) fd.append("html_body", html_body);
  for (const f of files) fd.append("files
