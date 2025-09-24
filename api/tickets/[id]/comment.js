// api/tickets/[id]/comment.js
const { readSession, getZendeskAuthHeader } = require("../../_utils/session");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.query;
    const base = `https://${session.subdomain}.zendesk.com`;
    const auth = getZendeskAuthHeader(session);

    // We expect multipart or form-data or JSON. We'll try to read raw body and fallback
    let text = "";
    await new Promise((resolve) => {
      req.on("data", (c) => (text += c));
      req.on("end", resolve);
    });

    let body = {};
    const ct = req.headers["content-type"] || "";
    if (ct.includes("application/json")) {
      try { body = JSON.parse(text || "{}"); } catch {}
    } else if (ct.includes("application/x-www-form-urlencoded")) {
      // naive parse
      text.split("&").forEach(kv => {
        const [k, v] = kv.split("=");
        if (k) body[decodeURIComponent(k)] = decodeURIComponent(v || "");
      });
    } else {
      // multipart or unknown → best effort: ignore files, read minimal fields from query fallback
      try { body = JSON.parse(text || "{}"); } catch { body = {}; }
    }

    const isPublic = String(body.isPublic ?? "true") === "true";
    const content = (body.body || body.html_body || "").trim() || "Attachment(s) uploaded.";

    const payload = {
      ticket: {
        comment: { body: content, public: isPublic },
      },
    };

    const r = await fetch(`${base}/api/v2/tickets/${id}.json`, {
      method: "PUT",
      headers: {
        Authorization: auth,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return res.status(r.status).json({ error: "Zendesk add comment failed", detail: t });
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    console.error("ADD COMMENT 500:", e);
    return res.status(500).json({ error: "Add comment failed", detail: String(e?.message || e) });
  }
};
