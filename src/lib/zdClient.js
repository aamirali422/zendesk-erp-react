import { apiUrl } from "@/lib/apiBase";

/**
 * Small helper: ensures response is ok, else throws with detail
 */
async function ensureOk(res) {
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.error || JSON.stringify(data);
    } catch {
      detail = await res.text();
    }
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json();
}

/**
 * GET /api/tickets/:id
 * Returns { ticket, users, organizations, groups }
 */
export async function getTicket(id) {
  const res = await fetch(apiUrl(`/api/tickets/${id}`), {
    credentials: "include",
  });
  return ensureOk(res);
}

/**
 * GET /api/tickets/:id/comments
 * Returns { comments, users }
 */
export async function listComments(id) {
  const res = await fetch(apiUrl(`/api/tickets/${id}/comments`), {
    credentials: "include",
  });
  return ensureOk(res);
}

/**
 * PUT /api/tickets/:id
 * Body: { ticket: { ...patchFields } }
 */
export async function updateTicket(id, ticketPatch) {
  const res = await fetch(apiUrl(`/api/tickets/${id}`), {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: ticketPatch }),
  });
  return ensureOk(res);
}

/**
 * POST /api/tickets/:id/comment
 * Multipart: body, html_body?, isPublic, files[]
 */
export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  const fd = new FormData();
  if (html_body) fd.append("html_body", html_body);
  fd.append("body", body || "Attachment(s) uploaded.");
  fd.append("isPublic", String(!!isPublic));

  for (const f of files) {
    fd.append("files", f);
  }

  const res = await fetch(apiUrl(`/api/tickets/${id}/comment`), {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  return ensureOk(res);
}
