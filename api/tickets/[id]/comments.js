// api/tickets/[id]/comments.js
export const config = { api: { bodyParser: false } };

import { Buffer } from "node:buffer";
import { getSessionFromCookie } from "../../../src/server-lib/cookies.js";

function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = getSessionFromCookie(req);
  if (!session?.email || !session?.token || !session?.subdomain) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ticket id" });

  const base = zendeskBaseUrl(session.subdomain);
  const auth = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");
  const url = `${base}/api/v2/tickets/${encodeURIComponent(id)}/comments.json?include=users`;

  try {
    const r = await fetch(url, { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } });
    const t = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: t || `Zendesk ${r.status}` });
    return res.status(200).send(t); // JSON string
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Comments handler failed" });
  }
}
