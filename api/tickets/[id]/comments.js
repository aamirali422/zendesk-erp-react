// api/tickets/[id]/comments.js
import { requireSession, zdFetch } from "../../../src/server-lib/zd.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  // path: /api/tickets/{id}/comments
  const parts = req.url.split("/api/tickets/")[1].split("/");
  const id = parts[0];

  try {
    const session = requireSession(req);
    const data = await zdFetch(session, `/api/v2/tickets/${id}/comments.json?include=users`);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  } catch (err) {
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || "Comments error" }));
  }
}
