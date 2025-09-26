// api/tickets/[id]/comments.js
import { getSessionFromCookie } from "../../../src/server-lib/cookies.js";

function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const session = getSessionFromCookie(req);
    if (!session?.email || !session?.token || !session?.subdomain) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing ticket id" });

    const include = "users";
    const inline = (req.query.inline ?? "true") === "true" ? "&include_inline_images=true" : "";
    const url = `${zendeskBaseUrl(session.subdomain)}/api/v2/tickets/${encodeURIComponent(id)}/comments.json?include=${encodeURIComponent(include)}${inline}`;

    const auth = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");
    const z = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });

    const text = await z.text();
    if (!z.ok) {
      return res.status(z.status).json({ error: text || `Zendesk error ${z.status}` });
    }
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).json({ ok: true });
    }
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Comments handler failed" });
  }
}
