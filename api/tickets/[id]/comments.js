// api/tickets/[id]/comments.js
const { readSession, getZendeskAuthHeader } = require("../../_utils/session");

module.exports = async (req, res) => {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.query;
    const base = `https://${session.subdomain}.zendesk.com`;
    const auth = getZendeskAuthHeader(session);

    const r = await fetch(`${base}/api/v2/tickets/${id}/comments.json?include=users`, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return res.status(r.status).json({ error: "Zendesk comments failed", detail: t });
    }
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("COMMENTS 500:", e);
    return res.status(500).json({ error: "Comments endpoint failed", detail: String(e?.message || e) });
  }
};
