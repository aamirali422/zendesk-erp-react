// api/login.js
const { serializeCookie } = require("./_utils/cookies");

module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // parse JSON body
    let body = "";
    await new Promise((resolve) => {
      req.on("data", (c) => (body += c));
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

    // verify against Zendesk
    const zdBase = `https://${subdomain}.zendesk.com`;
    const auth = Buffer.from(`${email}/token:${token}`).toString("base64");

    const r = await fetch(`${zdBase}/api/v2/users/me.json`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });

    if (r.status === 401 || r.status === 403) {
      return res.status(401).json({ error: "Invalid Zendesk credentials or permissions" });
    }
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({ error: `Zendesk verify failed (${r.status})`, detail: text });
    }

    const me = await r.json();

    // store session in cookie (base64 JSON; demo only)
    const session = Buffer.from(JSON.stringify({ email, token, subdomain })).toString("base64");
    const maxAge = 60 * 60 * 12; // 12h

    res.setHeader(
      "Set-Cookie",
      serializeCookie("zd_session", session, {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        path: "/",
        maxAge,
      })
    );

    return res.status(200).json({ ok: true, user: me?.user || null, subdomain });
  } catch (e) {
    console.error("LOGIN 500:", e);
    return res.status(500).json({ error: "Login failed", detail: String(e?.message || e) });
  }
};
