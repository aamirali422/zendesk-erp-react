import { readSession } from "./_utils/session.js";

export default async function handler(req, res) {
  const s = readSession(req);
  if (!s) {
    res.status(401).json({ error: "No active session" });
    return;
  }
  res.status(200).json({
    email: s.email,
    subdomain: s.subdomain,
    ok: true,
  });
}
