// src/lib/zdClient.js
import { apiUrl } from "@/lib/apiBase";

/**
 * Read the response body exactly once.
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

  if (!text) return {};
  throw new Error("Expected JSON but received non-JSON response.");
}

async function request(
  path,
  { method = "GET", headers = {}, body, credentials = "include", parseJson = true } = {}
) {
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

/* ========= ZENDESK PROXY ========= */

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

export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  const fd = new FormData();
  fd.append("body", (body || "").trim() || "Attachment(s) uploaded.");
  fd.append("isPublic", String(!!isPublic));
  if (html_body) fd.append("html_body", html_body);
  for (const f of files) fd.append("files", f);

  return request(`/api/tickets/${encodeURIComponent(id)}/comment`, {
    method: "POST",
    body: fd,
  });
}
