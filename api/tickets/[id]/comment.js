import { readSession } from "../../../_utils/session.js";

// Accepts multipart/form-data or JSON (body -> { body, html_body, isPublic, files[] })
export default async function handler(req, res) {
  const s = readSession(req);
  if (!s) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Missing ticket id" });
    return;
  }

  try {
    // Build a JSON comment payload (attachments upload skipped for brevity in ESM demo)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const contentType = (req.headers["content-type"] || "").toLowerCase();

    let body = "Attachment(s) uploaded.";
    let html_body = undefined;
    let isPublic = true;

    if (contentType.includes("application/json")) {
      const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      body = parsed.body || body;
      html_body = parsed.html_body;
      isPublic = String(parsed.isPublic) !== "false";
    } else {
      // Fallback: treat as text
      const raw = Buffer.concat(chunks).toString("utf8");
      if (raw.trim()) body = raw.trim();
    }

    const payload = {
      ticket: {
        comment: {
          body,
          ...(html_body ? { html_body } : {}),
          public: !!isPublic
        }
      }
    };

    const url = `https://${s.subdomain}.zendesk.com/api/v2/tickets/${encodeURIComponent(id)}.json`;
    const auth = Buffer.from(`${s.email}/token:${s.token}`, "utf8").toString("base64");

    const upstream = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();
    try {
      const json = JSON.parse(text);
      res.status(upstream.status).json(json);
    } catch {
      res.status(upstream.status).send(text);
    }
  } catch (e) {
    console.error("comment post error:", e);
    res.status(500).json({ error: "Post comment failed" });
  }
}
