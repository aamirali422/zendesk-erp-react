// api/_utils/cookies.js
function serializeCookie(name, value, opts = {}) {
  const enc = encodeURIComponent;
  let cookie = `${name}=${enc(value)}`;

  if (opts.maxAge != null) cookie += `; Max-Age=${Math.floor(opts.maxAge)}`;
  if (opts.domain) cookie += `; Domain=${opts.domain}`;
  cookie += `; Path=${opts.path || "/"}`;
  if (opts.expires) cookie += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.httpOnly) cookie += `; HttpOnly`;
  if (opts.secure) cookie += `; Secure`;
  if (opts.sameSite) cookie += `; SameSite=${opts.sameSite || "Lax"}`;
  return cookie;
}

function parseCookies(req) {
  const h = req.headers.cookie || "";
  const out = {};
  h.split(";").forEach((p) => {
    const idx = p.indexOf("=");
    if (idx > -1) {
      const k = p.slice(0, idx).trim();
      const v = p.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

module.exports = { serializeCookie, parseCookies };
