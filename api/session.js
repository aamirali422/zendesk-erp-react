import { getSession } from "./_session.js";

export default async function handler(req, res) {
  const sess = getSession(req, res);
  if (!sess) return;
  res.json({ ok: true, email: sess.email, subdomain: sess.subdomain });
}
