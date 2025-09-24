// api/zendesk.js
const { Buffer } = require("node:buffer");

function readCookies(header = "") {
  const out = {};
  header.split(/;\s*/).filter(Boolean).forEach(kv => {
    const idx = kv.indexOf("=");
    if (idx > -1) out[decodeURIComponent(kv.slice(0, idx))] = decodeURIComponent(kv.slice(idx + 1));
  });
  return out;
}

function readSession(req) {
  const cookies = readCookies(req.headers.cookie || "");
  if (cookies.zd) {
    try { return JSON.parse(cookies.zd); } catch { /* ignore */ }
  }
  // Fallback to env if cookie is missing (helps first-run testing on Vercel)
  const email = process.env.ZENDESK_EMAIL;
  const token = process.env.ZENDESK_TOKEN;
  const subdomain = process.env.ZENDESK_SUBDOMAIN;
  if (email && token && subdomain) return { email, token, subdomain };
  return null;
}

module.exports = async (req, res) => {
  try {
    const sess = readSession(req);
    if (!sess) {
      return res.status(401).json({ error: "Unauthorized", detail: "No session and no env fallback." });
    }

    const raw = (req.query && req.query.path) || "";
    const path = decodeURIComponent(raw);
    if (!path || !path.startsWith("/api/v2")) {
      return res.status(400).json({ error: "Invalid 'path' (must start with /api/v2)" });
    }

    const zendeskUrl = `https://${sess.subdomain}.zendesk.com${path}`;
    const basic = Buffer.from(`${sess.email}/token:${sess.token}`).toString("base64");

    const upstream = await fetch(zendeskUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "zendesk-erp-proxy"
      }
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      // Try to return Zendesk's JSON error
      try {
        const j = JSON.parse(text || "{}");
        return res.status(upstream.status).json(j);
      } catch {
        return res.status(upstream.status).json({
          error: `Zendesk ${upstream.status}`,
          detail: text || null,
          url: path
        });
      }
    }

    const data = text ? JSON.parse(text) : {};
    return res.status(200).json(data);
  } catch (err) {
    console.error("api/zendesk crash:", err);
    return res.status(500).json({ error: "Proxy error", detail: err?.message || String(err) });
  }
};
