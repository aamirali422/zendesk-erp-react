// api/zendesk.js
import { sessionFromReq, zdGetJSON } from "./_utils/zd.js";

export default async function handler(req, res) {
  const session = sessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.searchParams.get("path") || "";

  if (!path.startsWith("/api/v2")) {
    return res.status(400).json({ error: "path must start with /api/v2" });
  }

  try {
    const data = await zdGetJSON(session, path);
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: e.message || "Zendesk error" });
  }
}
