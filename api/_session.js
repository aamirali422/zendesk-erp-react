// /api/_session.js
export function authHeader(email, token) {
  const raw = `${email}/token:${token}`;
  const b64 = Buffer.from(raw).toString("base64");
  return `Basic ${b64}`;
}

// Set an HTTP-only cookie with serialized session info
export function setSessionCookie(req, res, { email, apiToken, subdomain }) {
  const value = Buffer.from(
    JSON.stringify({ email, apiToken, subdomain })
  ).toString("base64");

  // 8 hours
  const maxAge = 60 * 60 * 8;

  res.setHeader("Set-Cookie", [
    `zd_sid=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  ]);
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", [
    `zd_sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`,
  ]);
}

export function getSession(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;)\s*zd_sid=([^;]+)/);
  if (!match) return null;
  try {
    const json = Buffer.from(match[1], "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj?.email || !obj?.apiToken || !obj?.subdomain) return null;
    return obj;
  } catch {
    return null;
  }
}
