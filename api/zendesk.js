import { requireSession, proxyZendesk } from "../src/server-lib/zd.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const session = requireSession(req);
    const { path } = req.query;
    if (!path || typeof path !== "string" || !path.startsWith("/api/v2")) {
      res.status(400).json({ error: "Query param `path` must start with /api/v2" });
      return;
    }
    await proxyZendesk(req, res, session, path);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Proxy error" });
  }
}
