// /api/session.js
export const config = { runtime: "nodejs20.x" };

import { getSession } from "./_session.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  const sess = getSession(req);
  if (!sess) return res.status(401).json({ ok: false, error: "Not authenticated" });
  res.json({ ok: true, email: sess.email, subdomain: sess.subdomain });
}
