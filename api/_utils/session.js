// api/_utils/session.js
const { parseCookies } = require("./cookies");

function readSession(req) {
  const cookies = parseCookies(req);
  const raw = cookies["zd_session"];
  if (!raw) return null;

  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(json);
    const email = String(parsed.email || "").trim();
    const token = String(parsed.token || "").trim();
    const subdomain = String(parsed.subdomain || "").trim();
    if (!email || !token || !subdomain) return null;
    return { email, token, subdomain };
  } catch {
    return null;
  }
}

function getZendeskAuthHeader(session) {
  const { email, token } = session;
  const base = Buffer.from(`${email}/token:${token}`).toString("base64");
  return `Basic ${base}`;
}

module.exports = { readSession, getZendeskAuthHeader };
