import { readSession } from "../../../_utils/session.js";

export default async function handler(req, res) {
  const s = readSession(req);
  if (!s) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Missing ticket id" });
    return;
  }

  const url = `https://${s.subdomain}.zendesk.com/api/v2/tickets/${encodeURIComponent(id)}/comments.json?include=users`;
  const auth = Buffer.from(`${s.email}/token:${s.token}`, "utf8").toString("base64");

  try {
    const r = await fetch(url, {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json"
      }
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error("comments list error:", e);
    res.status(500).json({ error: "Comments fetch failed" });
  }
}
