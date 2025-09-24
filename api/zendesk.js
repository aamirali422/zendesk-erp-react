import { readSession } from "./_utils/session.js";

// Simple Zendesk proxy: /api/zendesk?path=/api/v2/...
export default async function handler(req, res) {
  try {
    const s = readSession(req);
    if (!s) {
      res.status(401).json({ error: "Unauthorized: no session" });
      return;
    }

    const path = String(req.query.path || "");
    if (!path.startsWith("/api/v2")) {
      res.status(400).json({ error: "Bad Request: path must start with /api/v2" });
      return;
    }

    const url = `https://${s.subdomain}.zendesk.com${path}`;
    const auth = Buffer.from(`${s.email}/token:${s.token}`, "utf8").toString("base64");

    const upstream = await fetch(url, {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });

    // Pass through the status
    const text = await upstream.text();
    // Try to return JSON if possible
    try {
      const json = JSON.parse(text);
      res.status(upstream.status).json(json);
    } catch {
      res.status(upstream.status).send(text);
    }
  } catch (e) {
    console.error("zendesk proxy error:", e);
    res.status(500).json({ error: "Proxy error" });
  }
}
