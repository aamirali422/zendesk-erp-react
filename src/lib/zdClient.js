// src/lib/zdClient.js

/**
 * Get full ticket details + requester, assignee, org, group
 */
export async function getTicket(id) {
  const r = await fetch(`/api/tickets/${id}`);
  if (!r.ok) throw new Error(`Failed to load ticket ${id}`);
  return r.json();
}

/**
 * Get comments (conversation)
 */
export async function listComments(id) {
  const r = await fetch(`/api/tickets/${id}/comments`);
  if (!r.ok) throw new Error(`Failed to load comments for ${id}`);
  return r.json(); // { comments: [...], users: [...] }
}

/**
 * Update ticket fields (status, priority, tags, etc.)
 */
export async function updateTicket(id, ticketPatch) {
  const r = await fetch(`/api/tickets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket: ticketPatch }),
  });
  if (!r.ok) throw new Error(`Failed to update ticket ${id}`);
  return r.json();
}

/**
 * Post a new comment (public/internal, with optional files)
 */
export async function postComment({ id, body, html_body, isPublic = true, files = [] }) {
  const fd = new FormData();
  if (body) fd.append("body", body);
  if (html_body) fd.append("html_body", html_body);
  fd.append("isPublic", String(!!isPublic));

  for (const f of files) {
    fd.append("files", f);
  }

  const r = await fetch(`/api/tickets/${id}/comment`, {
    method: "POST",
    body: fd,
  });
  if (!r.ok) throw new Error(`Failed to post comment on ticket ${id}`);
  return r.json();
}
