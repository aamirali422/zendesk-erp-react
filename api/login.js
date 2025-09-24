import { writeSession } from "./_utils/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));

    const email = String(body.email || "").trim();
    const token = String(body.token || "").trim();
    const subdomain = String(body.subdomain || "").trim();

    if (!email || !token || !subdomain) {
      res.status(400).json({ error: "email, token, subdomain are required" });
      return;
    }

    // Persist in cookie (demo; consider storing a Zendesk OAuth in production)
    writeSession(res, { email, token, subdomain });

    res.status(200).json({
      ok: true,
      user: { email },
      subdomain,
    });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ error: "Login failed" });
  }
}
