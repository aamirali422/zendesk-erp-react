// api/_utils/zendesk.js
export function basicAuthHeader() {
  const email = process.env.ZENDESK_EMAIL;
  const token = process.env.ZENDESK_TOKEN;
  if (!email || !token) throw new Error("Zendesk credentials missing");
  const b64 = Buffer.from(`${email}/token:${token}`).toString("base64");
  return { Authorization: `Basic ${b64}` };
}

export function apiBase() {
  const sub = process.env.ZENDESK_SUBDOMAIN;
  if (!sub) throw new Error("ZENDESK_SUBDOMAIN missing");
  return `https://${sub}.zendesk.com/api/v2`;
}
