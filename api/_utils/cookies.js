// api/_utils/cookies.js

// Serialize a cookie (very small, no deps)
function serializeCookie(name, value, opts = {}) {
  const enc = encodeURIComponent;
  let cookie = `${name}=${enc(value)}`;

  if (opts.maxAge != null) cookie += `; Max-Age=${Math.floor(opts.maxAge)}`;
  if (opts.domain) cookie += `; Domain=${opts.domain}`;
  cookie += `; Path=${opts.path || "/"}`;
  if (opts.expires) cookie += `; Expires=${opts.expires.toUTCString()}`;
  if (opts.httpOnly) cookie += `; HttpOnly`;
  if (opts.secure) cookie += `; Secure`;
  if (opts.sameSite) {
    const v = typeof opts.sameSite === "string" ? opts.sameSite : "Lax";
    cookie += `; SameSite=${v}`;
  }
  return cookie;
}

module.exports = { serializeCookie };
