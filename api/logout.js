// api/logout.js
import { clearCookie } from "./_utils/cookies.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  clearCookie(res, "zd_session");
  return res.json({ ok: true });
}
