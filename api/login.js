import { doLogin } from "../src/server-lib/zd.js";
import { setSessionCookie } from "../src/server-lib/cookies.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const session = await doLogin(req, res); // validates presence of email/token/subdomain
    setSessionCookie(res, session, { maxDays: 30 /* production will be Secure */ });
    res.status(200).json({ ok: true, user: { email: session.email }, subdomain: session.subdomain });
  } catch (e) {
    res.status(400).json({ error: e.message || "Login failed" });
  }
}
