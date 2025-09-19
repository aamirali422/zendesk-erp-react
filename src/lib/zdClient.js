// src/lib/zdClient.js
import { apiUrl, ensureOk } from "@/lib/apiBase";

/* ---------------- Auth ---------------- */

export async function login({ email, token, subdomain }) {
  const res = await fetch(apiUrl("/api/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, subdomain }),
  });
  await ensureOk(res);
  return res.json(); // { ok:true, user, subdomain }
}

export async function getSession() {
  const res = await fetch(apiUrl("/api/session"), { credentials: "include" });
  await ensureOk(res);
  return res.json(); // { ok:true, email, subdomain }
}

export async function logout() {
  const res = await fetch(apiUrl("/api/logout"), {
    method: "POST",
    credentials: "include",
  });
  await ensureOk(res);
  return res.json(); // { ok:true }
}

/* ------------- Ticket Detail (your existing helpers) ------------- */

/** GET /api/tickets/:id -> { ticket, users, organizations, groups } */
export async function getTicket(id) {
  const res = await fetch(apiUrl(`/api/tickets/${id}`), {
    credentials: "include",
  });
  await ensureOk(res);
  return res.json();
}

/** GET /api/tickets/:id/comments -> { comments, users } */
export async function listComments(id) {
  const res = await fetch(apiUrl(`/api/tickets/${id}/comments`), {
    credentials: "include",
  });
  await ensureOk(res);
  return res.json();
}

/** PUT /api/tickets/:id  (body: { ticket: { ...patch } }) */
export async function updateTicket(id, ticketPatch) {
  const res = await fetch(apiUrl(`/api/tickets/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: ticketPatch }),
  });
  await ensureOk(res);
  return res.json();
}

/** POST /api/tickets/:id/comment (multipart) */
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
  await ensureOk(res);
  return res.json();
}
