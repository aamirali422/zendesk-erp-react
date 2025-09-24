// api/zendesk.js
import { apiBase, basicAuthHeader } from "./_utils/zendesk.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
    const path = req.query.path;
    if (!path || !String(path).startsWith("/api/v2"))
      return res.status(400).json({ error: "Missing or invalid path" });

    const url = `${apiBase()}${String(path).replace("/api/v2", "")}`;
    const r = await fetch(url, {
      headers: { "Content-Type": "application/json", ...basicAuthHeader() },
    });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { return res.status(r.status).send(text); }
    return res.status(r.status).json(body);
  } catch (e) {
    return res.status(500).json({ error: e.message || "Proxy error" });
  }
}
