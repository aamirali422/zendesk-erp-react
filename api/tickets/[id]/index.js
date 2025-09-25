// api/tickets/[id]/index.js
export const config = { runtime: "nodejs" };

const COOKIE_NAME = "zd";
const parseCookies = (req) =>
  (req.headers.cookie || "").split(";").reduce((a, p) => {
    const [k, v] = p.split("=").map(s => s && s.trim());
    if (!k) return a; a[k] = decodeURIComponent(v || ""); return a;
  }, {});
function getSessionFromCookie(req) {
  const raw = parseCookies(req)[COOKIE_NAME];
  if (!raw) return null;
  try { return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")); } catch { return null; }
}
const base = (sub) => `https://${sub}.zendesk.com`;
const authHeader = (e,t) => ({ Authorization: "Basic " + Buffer.from(`${e}/token:${t}`).toString("base64") });

export default async function handler(req, res) {
  const session = getSessionFromCookie(req);
  if (!session?.email || !session?.token || !session?.subdomain) {
    return res.status(401).json({ error: "Not authenticated (missing zd cookie)" });
  }
  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: "Missing ticket id" });

  try {
    if (req.method === "GET") {
      const url = `${base(session.subdomain)}/api/v2/tickets/${encodeURIComponent(id)}.json?include=users,organizations,groups`;
      const r = await fetch(url, { headers: { ...authHeader(session.email, session.token), Accept: "application/json" } });
      const txt = await r.text();
      const json = txt ? JSON.parse(txt) : {};
      if (!r.ok) return res.status(r.status).json(json || { error: "Zendesk error" });
      return res.status(200).json(json);
    }

    if (req.method === "PUT") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString("utf8") || "{}";
      const url = `${base(session.subdomain)}/api/v2/tickets/${encodeURIComponent(id)}.json`;
      const r = await fetch(url, {
        method: "PUT",
        headers: { ...authHeader(session.email, session.token), "Content-Type": "application/json", Accept: "application/json" },
        body,
      });
      const txt = await r.text();
      const json = txt ? JSON.parse(txt) : {};
      if (!r.ok) return res.status(r.status).json(json || { error: "Zendesk error" });
      return res.status(200).json(json);
    }

    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("ticket index error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
