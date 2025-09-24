// api/tickets/[id].js
const { readSession, getZendeskAuthHeader } = require("../_utils/session");

module.exports = async (req, res) => {
  try {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.query; // Vercel provides it for [id].js
    const base = `https://${session.subdomain}.zendesk.com`;
    const auth = getZendeskAuthHeader(session);

    if (req.method === "GET") {
      // ticket with side-loads
      const r = await fetch(
        `${base}/api/v2/tickets/${id}.json?include=users,organizations`,
        { headers: { Authorization: auth, Accept: "application/json" } }
      );
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        return res.status(r.status).json({ error: "Zendesk error", detail: t });
      }
      const data = await r.json();
      return res.status(200).json(data);
    }

    if (req.method === "PUT") {
      // parse JSON
      let body = "";
      await new Promise((resolve) => {
        req.on("data", (c) => (body += c));
        req.on("end", resolve);
      });
      let patch;
      try {
        patch = JSON.parse(body || "{}");
      } catch {
        return res.status(400).json({ error: "Invalid JSON body" });
      }

      const r = await fetch(`${base}/api/v2/tickets/${id}.json`, {
        method: "PUT",
        headers: {
          Authorization: auth,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        return res.status(r.status).json({ error: "Zendesk update failed", detail: t });
      }
      const data = await r.json();
      return res.status(200).json(data);
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("TICKET [id] 500:", e);
    return res.status(500).json({ error: "Ticket endpoint failed", detail: String(e?.message || e) });
  }
};
