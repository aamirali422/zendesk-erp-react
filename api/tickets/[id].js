// api/tickets/[id].js
import { apiBase, basicAuthHeader } from "../../_utils/zendesk.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing ticket id" });
  }

  try {
    if (req.method === "GET") {
      // side-load users & organizations
      const url = `${apiBase()}/tickets/${id}.json?include=users,organizations`;
      const r = await fetch(url, { headers: basicAuthHeader() });
      const text = await r.text();

      if (r.headers.get("content-type")?.includes("application/json")) {
        return res.status(r.status).json(JSON.parse(text));
      }
      return res.status(r.status).send({ error: text });
    }

    if (req.method === "PUT") {
      const url = `${apiBase()}/tickets/${id}.json`;
      const r = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...basicAuthHeader() },
        body: JSON.stringify(req.body || {}),
      });
      const text = await r.text();

      if (r.headers.get("content-type")?.includes("application/json")) {
        return res.status(r.status).json(JSON.parse(text));
      }
      return res.status(r.status).send({ error: text });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("Ticket API error:", e);
    return res.status(500).json({ error: e.message || "Ticket API error" });
  }
}
