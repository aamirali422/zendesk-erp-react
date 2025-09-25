import { clearSessionCookie } from "../src/server-lib/cookies.js";

export default async function handler(_req, res) {
  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}
