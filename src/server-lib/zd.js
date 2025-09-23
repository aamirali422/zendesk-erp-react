// src/server-lib/zd.js
import { getSessionFromCookie } from "./cookies.js";

function ensurePath(path) {
  if (!path || !path.startsWith("/api/v2")) {
    const e = new Error("Path must start with /api/v2");
    e.status = 400;
    throw e;
  }
  return path;
}

export function requireSession(req) {
  const s = getSessionFromCookie(req);
  if (!s || !s.email || !s.token || !s.subdomain) {
    const e = new Error("Not authenticated");
    e.status = 401;
    throw e;
  }
  return s;
}

export function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

export async function zdFetch(session, path, init = {}) {
  ensurePath(path);
  const base = zendeskBaseUrl(session.subdomain);
  const url = `${base}${path}`;

  const headers = {
    ...(init.headers || {}),
    "Content-Type": init.body ? "application/json" : (init.headers || {})["Content-Type"],
    "Authorization": "Basic " + Buffer.from(`${session.email}/token:${session.token}`).toString("base64"),
  };

  const resp = await fetch(url, { ...init, headers });
  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(text || `Zendesk HTTP ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  const ct = resp.headers.get("content-type") || "";
  if (ct.includes("application/json")) return resp.json();
  return resp.text();
}

/** Minimal login: trust provided creds & set cookie. (Optionally you can validate by calling /api/v2/users/me.json) */
export async function doLogin(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString("utf8");
  const { email, token, subdomain } = JSON.parse(body || "{}");

  if (!email || !token || !subdomain) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "email, token, subdomain required" }));
  }

  // (Optional) validate:
  // try {
  //   const tmp = { email, token, subdomain };
  //   await zdFetch(tmp, "/api/v2/users/me.json");
  // } catch {
  //   res.statusCode = 401;
  //   return res.end(JSON.stringify({ error: "Invalid Zendesk credentials" }));
  // }

  const session = { email, token, subdomain };
  return session;
}

/** Proxy GET to Zendesk: /api/zendesk?path=/api/v2/... */
export async function proxyZendesk(req, res, session, path) {
  try {
    const data = await zdFetch(session, path);
    res.setHeader("Content-Type", "application/json");
    res.end(typeof data === "string" ? data : JSON.stringify(data));
  } catch (err) {
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || "Proxy error" }));
  }
}
