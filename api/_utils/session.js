import { parseCookies, serializeCookie } from "./cookies.js";

const COOKIE_NAME = "zd_session";
// 7 days
const MAX_AGE = 7 * 24 * 60 * 60;

export function readSession(req) {
  try {
    const cookies = parseCookies(req);
    const raw = cookies[COOKIE_NAME];
    if (!raw) return null;
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json);
    if (!data?.email || !data?.token || !data?.subdomain) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSession(res, { email, token, subdomain }) {
  const payload = { email, token, subdomain };
  const raw = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const cookie = serializeCookie(COOKIE_NAME, raw, {
    maxAge: MAX_AGE,
    // `secure` set in serializer, SameSite=Lax
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearSession(res) {
  const cookie = serializeCookie(COOKIE_NAME, "", {
    maxAge: 0,
    expires: new Date(0),
  });
  res.setHeader("Set-Cookie", cookie);
}
