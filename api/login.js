// api/login.js
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    // Normally you would verify Zendesk credentials here.
    // For now, we just set a dummy cookie so the frontend knows you're "logged in".
    const { email } = req.body || {};

    res.setHeader(
      "Set-Cookie",
      "sid=ok; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400"
    );

    return res.json({
      ok: true,
      subdomain: process.env.ZENDESK_SUBDOMAIN || "",
      user: { email: email || "agent@example.com" },
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ error: e.message || "Login failed" });
  }
}
