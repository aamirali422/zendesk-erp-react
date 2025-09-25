export const config = { runtime: "nodejs" };

export function baseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

export function authHeader(session) {
  const basic = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");
  return { Authorization: `Basic ${basic}` };
}

export async function zdFetch(session, path, init = {}) {
  if (!path || !path.startsWith("/api/v2")) {
    const e = new Error("Path must start with /api/v2");
    e.status = 400; throw e;
  }
  const url = `${baseUrl(session.subdomain)}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
      ...authHeader(session),
    }
  });
  const txt = await res.text();
  const body = txt ? ( (()=>{ try { return JSON.parse(txt); } catch { return { raw: txt }; } })() ) : null;
  if (!res.ok) {
    const msg = body?.error || body?.description || res.statusText;
    const err = new Error(`Zendesk ${res.status}: ${msg}`);
    err.status = res.status; err.body = body; throw err;
  }
  return body;
}
