// api/tickets/[id]/index.js
export const config = { api: { bodyParser: true } };

import { Buffer } from "node:buffer";
import { getSessionFromCookie } from "../../../src/server-lib/cookies.js";

function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

export default async function handler(req, res) {
  const session = getSessionFromCookie(req);
  if (!session?.email || !session?.token || !session?.subdomain) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ticket id" });

  const base = zendeskBaseUrl(session.subdomain);
  const auth = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");
  const url = `${base}/api/v2/tickets/${encodeURIComponent(id)}.json`;

  try {
    if (req.method === "GET") {
      const r = await fetch(url, { headers: { Authorization: `Basic ${auth}`, Accept: "application/json" } });
      const t = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: t || `Zendesk ${r.status}` });
      // Optionally also fetch sideloads (users/orgs) via include param if needed
      return res.status(200).send(t); // already JSON string
    }

    if (req.method === "PUT") {
      // Expect body: { ticket: { requester_id?, requester?, assignee_id?, type?, priority?, status?, tags? } }
      const payload = req.body?.ticket ? req.body : { ticket: req.body || {} };

      const r = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const t = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: t || `Zendesk ${r.status}` });
      return res.status(200).send(t); // JSON string
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Ticket handler failed" });
  }
}
