// /api/zendesk.js
export const config = { runtime: "nodejs20.x" };

import axios from "axios";
import { getSession, authHeader } from "./_session.js";

/**
 * Usage from frontend:
 *   /api/zendesk?path=/api/v2/tickets.json?per_page=50
 *   /api/zendesk?path=/api/v2/tickets/123.json?include=users,organizations,groups
 * Methods: GET/POST/PUT/DELETE -> proxied to Zendesk with Basic auth.
 */
export default async function handler(req, res) {
  const sess = getSession(req);
  if (!sess) return res.status(401).json({ ok: false, error: "Not authenticated" });

  const path = req.query?.path;
  if (!path || !String(path).startsWith("/api/v2")) {
    return res.status(400).json({ ok: false, error: "Missing or invalid ?path=/api/v2/..." });
  }

  const base = `https://${sess.subdomain}.zendesk.com`;
  const url = `${base}${path}`;

  const headers = {
    Authorization: authHeader(sess.email, sess.apiToken),
    "Content-Type": "application/json",
  };

  try {
    let out;
    if (req.method === "GET") {
      out = await axios.get(url, { headers });
    } else if (req.method === "POST") {
      out = await axios.post(url, req.body, { headers });
    } else if (req.method === "PUT") {
      out = await axios.put(url, req.body, { headers });
    } else if (req.method === "DELETE") {
      out = await axios.delete(url, { headers });
    } else {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    res.status(out.status).json(out.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ ok: false, error: err?.response?.data || err.message });
  }
}
