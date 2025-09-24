// api/logout.js
export default async function handler(_req, res) {
  try {
    // Clear the cookie by setting Max-Age=0
    res.setHeader(
      "Set-Cookie",
      "sid=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error("Logout error:", e);
    return res.status(500).json({ error: e.message || "Logout failed" });
  }
}
