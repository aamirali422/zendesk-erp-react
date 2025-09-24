// api/tickets/[id].js
import { apiBase, basicAuthHeader } from "../../_utils/zendesk.js";

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    if (req.method === "GET") {
      // include users & orgs via side-loading
      const url = `${apiBase()}/tickets/${id}.json?include=users,organizations`;
      const r = await fetch(url, { headers: { ...basicAuthHeader() } });
      const text = await r.text();
      try { return res.status(r.status).json(JSON.parse(text)); }
      catch { return res.status(r.status).send(text); }
    }

    if (req.method === "PUT") {
      const url = `${apiBase()}/tickets/${id}.json`;
      const r = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...basicAuthHeader() },
        body: JSON.stringify(req.body || {}),
      });
      const text = await r.text();
      try { return res.status(r.status).json(JSON.parse(text)); }
      catch { return res.status(r.status).send(text); }
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Ticket error" });
  }
}
