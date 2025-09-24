// api/zendesk.js
// Vercel Serverless Function (Node "nodejs" runtime)

const { Buffer } = require("node:buffer");

function readSession(req) {
  // Expect a cookie "zd" storing JSON: { email, token, subdomain }
  const cookie = req.headers.cookie || "";
  const map = Object.fromEntries(
    cookie.split(/;\s*/).filter(Boolean).map((kv) => {
      const [k, ...v] = kv.split("=");
      return [decodeURIComponent(k.trim()), decodeURIComponent((v.join("=") || "").trim())];
    })
  );
  if (!map.zd) return null;
  try {
    return JSON.parse(map.zd);
  } catch {
    return null;
  }
}

function badRequest(res, msg) {
  res.status(400).json({ error: msg || "Bad Request" });
}

function unauthorized(res, msg) {
  res.status(401).json({ error: msg || "Unauthorized" });
}

module.exports = async (req, res) => {
  try {
    // 1) Must have a session cookie
    const sess = readSession(req);
    if (!sess || !sess.email || !sess.token || !sess.subdomain) {
      return unauthorized(res, "Not logged in. Please sign in.");
    }

    // 2) Read & decode the path query
    // On Vercel, req.query.path is URL-encoded. Decode it before validating.
    const raw = (req.query && req.query.path) || "";
    const path = decodeURIComponent(raw);
    if (!path || !path.startsWith("/api/v2")) {
      return badRequest(res, "Missing or invalid 'path' (must start with /api/v2)");
    }

    // 3) Build Zendesk URL
    const zendeskUrl = `https://${sess.subdomain}.zendesk.com${path}`;

    // 4) Auth header: Basic with "email/token:apiToken"
    const basic = Buffer.from(`${sess.email}/token:${sess.token}`).toString("base64");

    // 5) Forward the request
    const upstream = await fetch(zendeskUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "zendesk-erp-proxy",
      },
    });

    // If Zendesk rejects, forward status & readable error
    const text = await upstream.text();
    if (!upstream.ok) {
      // Try to pass through JSON if present, else a generic message
      try {
        const j = JSON.parse(text || "{}");
        return res.status(upstream.status).json(j);
      } catch {
        return res.status(upstream.status).json({
          error: `Zendesk ${upstream.status}`,
          detail: text || null,
        });
      }
    }

    // 6) OK → return JSON
    const data = text ? JSON.parse(text) : {};
    return res.status(200).json(data);
  } catch (err) {
    console.error("api/zendesk error:", err);
    return res.status(500).json({ error: "Proxy error", detail: err?.message || String(err) });
  }
};
