// api/tickets/[id]/comment.js
import { apiBase, basicAuthHeader } from "../../../_utils/zendesk.js";

export const config = { api: { bodyParser: false } }; // let FormData stream through

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });

    // Forward the incoming multipart form-data to Zendesk
    const headers = { ...basicAuthHeader() }; // DO NOT set content-type; keep boundary from req
    const r = await fetch(`${apiBase()}/tickets/${id}/comments.json`, {
      method: "POST",
      headers,
      body: req, // stream directly
    });

    const text = await r.text();
    try { return res.status(r.status).json(JSON.parse(text)); }
    catch { return res.status(r.status).send(text); }
  } catch (e) {
    return res.status(500).json({ error: e.message || "Post comment error" });
  }
}
