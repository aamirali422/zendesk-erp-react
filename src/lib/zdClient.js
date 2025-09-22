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

export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  const fd = new FormData();
  if (html_body) fd.append("html_body", html_body);
  fd.append("body", body || "Attachment(s) uploaded.");
  fd.append("isPublic", String(!!isPublic));
  for (const f of files) fd.append("files", f);

  const res = await fetch(apiUrl(`/api/tickets/${id}/comment`), {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  return ensureJson(res);
}
