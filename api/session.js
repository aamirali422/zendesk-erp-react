export const config = { runtime: "nodejs" };
import { getSession } from "./_session.js";

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "No session" });
  res.status(200).json({ user: { email: s.email }, subdomain: s.subdomain });
}
