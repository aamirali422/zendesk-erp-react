// api/zendesk.js
import { proxyZendesk, requireSession } from "../src/server-lib/zd.js";

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.searchParams.get("path");
  res.setHeader("Content-Type", "application/json");
  if (!path) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "Missing ?path" }));
  }
  try {
    const session = requireSession(req);
    await proxyZendesk(req, res, session, path);
  } catch (err) {
    res.statusCode = err.status || 401;
    res.end(JSON.stringify({ error: err.message || "Unauthorized" }));
  }
}
