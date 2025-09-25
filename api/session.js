import { getSessionFromCookie } from "../src/server-lib/cookies.js";

export default async function handler(req, res) {
  const s = getSessionFromCookie(req);
  if (!s) {
    res.status(401).json({ error: "No session" });
    return;
  }
  res.status(200).json({ ok: true, user: { email: s.email }, subdomain: s.subdomain });
}
