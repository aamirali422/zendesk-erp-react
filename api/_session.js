// api/_session.js
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

const sessions = new Map(); // in-memory per function region

export function setSessionCookie(res, data) {
  const sid = randomUUID();
  sessions.set(sid, data);
  // SameSite=None, Secure required for cross-domain (Vercel <-> Zendesk call)
  const prod = process.env.VERCEL === "1";
  const cookie = [
    `zd_sid=${sid}`,
    "Path=/",
    `HttpOnly`,
    prod ? "SameSite=None" : "SameSite=Lax",
    prod ? "Secure" : "",
    `Max-Age=${60 * 60 * 8}`
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function getSession(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)zd_sid=([^;]+)/);
  if (!match) {
    res.statusCode = 401;
    res.json({ ok: false, error: "Not authenticated" });
    return null;
  }
  const sid = decodeURIComponent(match[1]);
  const sess = sessions.get(sid);
  if (!sess) {
    res.statusCode = 401;
    res.json({ ok: false, error: "Not authenticated" });
    return null;
  }
  return { sid, ...sess };
}

export function clearSessionCookie(req, res) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)zd_sid=([^;]+)/);
  if (match) sessions.delete(decodeURIComponent(match[1]));
  const prod = process.env.VERCEL === "1";
  const cookieStr = [
    "zd_sid=;",
    "Path=/",
    "HttpOnly",
    prod ? "SameSite=None" : "SameSite=Lax",
    prod ? "Secure" : "",
    "Max-Age=0"
  ].filter(Boolean).join("; ");
  res.setHeader("Set-Cookie", cookieStr);
}

export function authHeader(email, token) {
  const b64 = Buffer.from(`${email}/token:${token}`).toString("base64");
  return `Basic ${b64}`;
}

