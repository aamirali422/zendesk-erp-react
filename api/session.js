// api/session.js
export default async function handler(req, res) {
  try {
    const cookie = req.headers.cookie || "";
    const loggedIn = cookie.includes("sid=ok");

    if (loggedIn) {
      return res.json({
        ok: true,
        subdomain: process.env.ZENDESK_SUBDOMAIN || "",
        user: { email: "agent@example.com" },
      });
    }

    return res.status(401).json({ ok: false, error: "Not logged in" });
  } catch (e) {
    console.error("Session error:", e);
    return res.status(500).json({ error: e.message || "Session check failed" });
  }
}
