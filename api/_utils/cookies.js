// ESM helpers to parse & serialize cookies without external deps

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  header.split(/; */).forEach((pair) => {
    if (!pair) return;
    const idx = pair.indexOf("=");
    const key = decodeURIComponent(pair.substring(0, idx).trim());
    const val = decodeURIComponent(pair.substring(idx + 1).trim());
    if (key) out[key] = val;
  });
  return out;
}

export function serializeCookie(name, value, options = {}) {
  const opt = {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: true,
    ...options,
  };

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (opt.maxAge != null) cookie += `; Max-Age=${Math.floor(opt.maxAge)}`;
  if (opt.domain) cookie += `; Domain=${opt.domain}`;
  if (opt.path) cookie += `; Path=${opt.path}`;
  if (opt.expires) cookie += `; Expires=${opt.expires.toUTCString()}`;
  if (opt.httpOnly) cookie += `; HttpOnly`;
  if (opt.secure) cookie += `; Secure`;
  if (opt.sameSite) cookie += `; SameSite=${opt.sameSite}`;

  return cookie;
}
