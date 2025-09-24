// api/login.js
// POST { email, token, subdomain } -> sets HttpOnly cookie "zd"
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString() || "{}");

    const email = String(body.email || process.env.ZENDESK_EMAIL || "").trim();
    const token = String(body.token || process.env.ZENDESK_TOKEN || "").trim();
    const subdomain = String(body.subdomain || process.env.ZENDESK_SUBDOMAIN || "").trim();

    if (!email || !token || !subdomain) {
      return res.status(400).json({ error: "Missing Zendesk credentials." });
    }

    const cookieValue = encodeURIComponent(JSON.stringify({ email, token, subdomain }));
    const isProd = process.env.VERCEL === "1";
    // For local: SameSite=Lax; Secure only in prod (HTTPS)
    const cookie = [
      `zd=${cookieValue}`,
      "Path=/",
      "HttpOnly",
      isProd ? "Secure; SameSite=None" : "SameSite=Lax",
      "Max-Age=86400"
    ].join("; ");

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ ok: true, user: { email }, subdomain });
  } catch (err) {
    console.error("api/login error:", err);
    return res.status(500).json({ error: "Login error", detail: err?.message || String(err) });
  }
};
