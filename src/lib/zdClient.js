// src/lib/zdClient.js
import { apiUrl, ensureJson } from "@/lib/apiBase";

export async function login({ email, token, subdomain }) {
  const res = await fetch(apiUrl("/api/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, subdomain }),
  });
  return ensureJson(res);
}

export async function getSession() {
  const res = await fetch(apiUrl("/api/session"), { credentials: "include" });
  return ensureJson(res);
}

export async function getTicket(id) {
  const res = await fetch(apiUrl(`/api/tickets/${id}`), { credentials: "include" });
  return ensureJson(res);
}

export async function listComments(id) {
  const res = await fetch(apiUrl(`/api/tickets/${id}/comments`), { credentials: "include" });
  return ensureJson(res);
}

export async function updateTicket(id, ticketPatch) {
  const res = await fetch(apiUrl(`/api/tickets/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: ticketPatch }),
  });
  return ensureJson(res);
}

/**
 * For production on Vercel, we send JSON (no multipart).
 * Attachments are not supported by the current server handler.
 */
export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  if (files && files.length > 0) {
    // You can swap this for a real upload flow later (Zendesk uploads API)
    throw new Error("File attachments are not supported on the current deployment.");
  }

  const res = await fetch(apiUrl(`/api/tickets/${id}/comment`), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      body: body || "Attachment(s) uploaded.",
      html_body,
      isPublic: !!isPublic,
    }),
  });
  return ensureJson(res);
}
