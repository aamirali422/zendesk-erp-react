// api/tickets/[id].js
export default async function handler(req, res) {
  try {
    if (req.method !== "GET" && req.method !== "PUT") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const { ZENDESK_EMAIL, ZENDESK_TOKEN, ZENDESK_SUBDOMAIN } = process.env;
    if (!ZENDESK_EMAIL || !ZENDESK_TOKEN || !ZENDESK_SUBDOMAIN) {
      return res.status(500).json({ error: "Zendesk env vars missing" });
    }

    const { id } = req.query;
    const base = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2`;

    const auth = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_TOKEN}`).toString("base64");
    const headers = { Authorization: `Basic ${auth}`, "Content-Type": "application/json" };

    if (req.method === "GET") {
      const r = await fetch(`${base}/tickets/${id}.json?include=users,organizations`, { headers });
      const data = await r.json();
      if (!r.ok) return res.status(r.status).json(data);
      return res.status(200).json({
        ticket: data.ticket,
        users: data.users || [],
        organizations: data.organizations || [],
      });
    }

    // PUT: update ticket fields
    const body = await req.json();
    const r = await fetch(`${base}/tickets/${id}.json`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(200).json(data);
  } catch (e) {
    console.error("tickets/[id] error:", e);
    res.status(500).json({ error: e.message || "Server error" });
  }
}
