// api/tickets/[id].js
import { sessionFromReq, zdGetJSON, zdPutJSON } from "../../_utils/zd.js";

export default async function handler(req, res) {
  const session = sessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method === "GET") {
    try {
      const data = await zdGetJSON(session, `/api/v2/tickets/${id}.json?include=users,organizations`);
      return res.json(data);
    } catch (e) {
      return res.status(502).json({ error: e.message || "Zendesk error" });
    }
  }

  if (req.method === "PUT") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body || "{}");
    try {
      const data = await zdPutJSON(session, `/api/v2/tickets/${id}.json`, parsed);
      return res.json(data);
    } catch (e) {
      return res.status(502).json({ error: e.message || "Zendesk error" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
