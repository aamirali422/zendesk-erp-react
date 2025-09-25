// api/tickets/[id]/comments.js
import { apiBase, basicAuthHeader } from "../../../_utils/zendesk.js";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing ticket id" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const url = `${apiBase()}/tickets/${id}/comments.json?include=users`;
    const r = await fetch(url, { headers: basicAuthHeader() });
    const text = await r.text();

    if (r.headers.get("content-type")?.includes("application/json")) {
      return res.status(r.status).json(JSON.parse(text));
    }
    return res.status(r.status).send({ error: text });
  } catch (e) {
    console.error("Comments API error:", e);
    return res.status(500).json({ error: e.message || "Comments API error" });
  }
}
