// api/zendesk.js
const { readSession, getZendeskAuthHeader } = require("./_utils/session");

/**
 * GET /api/zendesk?path=/api/v2/...
 */
module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const session = readSession(req);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized: no session" });
    }

    const path = String((req.query && req.query.path) || "").trim();
    if (!path.startsWith("/api/v2")) {
      return res.status(400).json({ error: "Bad Request: path must start with /api/v2" });
    }

    const url = `https://${session.subdomain}.zendesk.com${path}`;
    const r = await fetch(url, {
      headers: {
        Authorization: getZendeskAuthHeader(session),
        Accept: "application/json",
      },
    });

    if (r.status === 401 || r.status === 403) {
      return res.status(401).json({ error: "Unauthorized to access Zendesk" });
    }
    if (r.status === 406) {
      return res.status(406).json({ error: "Not Acceptable from Zendesk" });
    }
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return res.status(r.status).json({ error: `Zendesk error ${r.status}`, detail: txt });
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("ZENDESK 500:", e);
    return res.status(500).json({ error: "Zendesk proxy failed", detail: String(e?.message || e) });
  }
};
