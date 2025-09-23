// api/logout.js
import { clearSessionCookie } from "../src/server-lib/cookies.js";

export default async function handler(_req, res) {
  clearSessionCookie(res);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}
