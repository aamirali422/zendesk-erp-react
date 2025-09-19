// /api/logout.js
export const config = { runtime: "nodejs20.x" };

import { clearSessionCookie } from "./_session.js";

export default async function handler(_req, res) {
  clearSessionCookie(res);
  res.json({ ok: true });
}
