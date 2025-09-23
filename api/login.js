// api/login.js
import { setSessionCookie } from "../src/server-lib/cookies.js";
import { doLogin } from "../src/server-lib/zd.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }
  try {
    const session = await doLogin(req, res);
    setSessionCookie(res, session);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, user: { email: session.email }, subdomain: session.subdomain }));
  } catch (err) {
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || "Login failed" }));
  }
}
