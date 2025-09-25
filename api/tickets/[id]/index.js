export const config = { runtime: "nodejs" };
import { getSession } from "../../_session.js";
import { zdFetch } from "../../_zd.js";

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "Not authenticated" });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method === "GET") {
    const include = req.query.include || "users,organizations,groups";
    try {
      const data = await zdFetch(s, `/api/v2/tickets/${id}.json?include=${encodeURIComponent(include)}`);
      res.status(200).json(data);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message, details: e.body });
    }
    return;
  }

  if (req.method === "PUT") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    try {
      const data = await zdFetch(s, `/api/v2/tickets/${id}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: payload.ticket || {} }),
      });
      res.status(200).json(data);
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message, details: e.body });
    }
    return;
  }

  res.status(405).end("Method Not Allowed");
}
