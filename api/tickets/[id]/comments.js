// api/tickets/[id]/comments.js
export default async function handler(req, res) {
  try {
    const { ZENDESK_EMAIL, ZENDESK_TOKEN, ZENDESK_SUBDOMAIN } = process.env;
    if (!ZENDESK_EMAIL || !ZENDESK_TOKEN || !ZENDESK_SUBDOMAIN) {
      return res.status(500).json({ error: "Zendesk env vars missing" });
    }

    const { id } = req.query;
    const base = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2`;
    const auth = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString("base64");
    const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

    if (req.method === "GET") {
      const r = await fetch(`${base}/tickets/${id}/comments.json?include=users`, { headers });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json({
        comments: data.comments || [],
        users: data.users || [],
      });
    }

    if (req.method === "POST") {
      // expect JSON: { body, html_body, isPublic }
      const payload = await req.json();
      const comment = {
        ticket: {
          comment: {
            body: payload.body || "",
            html_body: payload.html_body || null,
            public: !!payload.isPublic,
          },
        },
      };
      const r = await fetch(`${base}/tickets/${id}.json`, {
        method: "PUT",
        headers,
        body: JSON.stringify(comment),
      });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json({ ok: true, ticket: data.ticket });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("tickets/[id]/comments error:", e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}
