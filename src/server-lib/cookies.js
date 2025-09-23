// src/server-lib/cookies.js
const COOKIE_NAME = "zd";

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [k, v] = part.split("=").map(s => s && s.trim());
    if (!k) return acc;
    acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}

export function getSessionFromCookie(req) {
  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function setSessionCookie(res, session, { maxDays = 30 } = {}) {
  const value = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const maxAge = maxDays * 24 * 3600;
  const cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    // NOTE: set Secure only when on HTTPS (Vercel prod is HTTPS)
    `Secure`,
    `Max-Age=${maxAge}`
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res) {
  const cookie = [
    `${COOKIE_NAME}=`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Secure`,
    `Max-Age=0`
  ].join("; ");
  res.setHeader("Set-Cookie", cookie);
}
