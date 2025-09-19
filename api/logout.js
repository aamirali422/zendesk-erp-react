import { clearSessionCookie } from "./_session.js";

export default async function handler(_req, res) {
  clearSessionCookie(_req, res);
  res.json({ ok: true });
}
