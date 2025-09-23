// api/_utils/cookies.js
export function getCookie(req, name) {
  const header = req.headers.cookie || "";
  const parts = header.split(/; */).map(s => s.trim());
  for (const part of parts) {
    if (!part) continue;
    const [k, ...rest] = part.split("=");
    if (k === name) return decodeURIComponent(rest.join("=") || "");
  }
  return null;
}

export function setCookie(res, name, value, {
  httpOnly = true,
  secure = true,
  sameSite = "Lax",
  path = "/",
  maxAge // ms
} = {}) {
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (httpOnly) cookie += "; HttpOnly";
  if (secure) cookie += "; Secure";
  if (maxAge) cookie += `; Max-Age=${Math.floor(maxAge / 1000)}`;
  res.setHeader("Set-Cookie", cookie);
}

export function clearCookie(res, name) {
  res.setHeader("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}
