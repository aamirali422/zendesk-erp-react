// api/login.js
const { serializeCookie } = require("./_utils/cookies");

/**
 * POST /api/login
 * Body: { email, token, subdomain }
 */
module.exports = async (req, res) => {
  try {
    // 1) Method guard
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // 2) Parse JSON safely
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (chunk) => (body += chunk));
      req.on("end", resolve);
    });

    let payload;
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    const email = String(payload.email || "").trim();
    const token = String(payload.token || "").trim();
    const subdomain = String(payload.subdomain || "").trim();

    if (!email || !token || !subdomain) {
      return res.status(400).json({ error: "email, token and subdomain are required" });
    }

    // 3) Verify with Zendesk (users/me)
    const zdBase = `https://${subdomain}.zendesk.com`;
    const auth = Buffer.from(`${email}/token:${token}`).toString("base64");

    const zdResp = await fetch(`${zdBase}/api/v2/users/me.json`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json"
      }
    });

    if (zdResp.status === 401 || zdResp.status === 403) {
      return res.status(401).json({ error: "Invalid Zendesk credentials or permissions" });
    }
    if (!zdResp.ok) {
      const text = await zdResp.text().catch(() => "");
      return res.status(502).json({ error: `Zendesk verify failed (${zdResp.status})`, detail: text });
    }

    const me = await zdResp.json();

    // 4) Make a tiny, signed-ish session value (keep simple)
    // In a real app you'd sign/encrypt this. For demo: minimal.
    const session = JSON.stringify({
      email,
      subdomain,
      // NEVER put the API token itself in a cookie in production.
      // Store it in a server session/DB or use OAuth. Demo-only here:
      token
    });

    // 5) Set cookie (HttpOnly, Secure, SameSite=Lax)
    const maxAge = 60 * 60 * 12; // 12h
    const cookie = serializeCookie("zd_session", Buffer.from(session).toString("base64"), {
      httpOnly: true,
      secure: true,           // required on Vercel (HTTPS)
      sameSite: "Lax",
      path: "/",
      maxAge
    });
    res.setHeader("Set-Cookie", cookie);

    // 6) Respond with minimal user info (no token)
    return res.status(200).json({
      ok: true,
      user: me?.user || null,
      subdomain
    });
  } catch (err) {
    // Always return JSON (avoid 500 with empty body)
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ error: "Login failed", detail: String(err && err.message || err) });
  }
};
