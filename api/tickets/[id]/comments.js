// api/tickets/[id]/comments.js
import { apiBase, basicAuthHeader } from "../../../_utils/zendesk.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const url = `${apiBase()}/tickets/${id}/comments.json?include=users`;
    const r = await fetch(url, { headers: { ...basicAuthHeader() } });
    const text = await r.text();
    try { return res.status(r.status).json(JSON.parse(text)); }
    catch { return res.status(r.status).send(text); }
  } catch (e) {
    return res.status(500).json({ error: e.message || "Comments error" });
  }
}
