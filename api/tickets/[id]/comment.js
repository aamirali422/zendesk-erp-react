// api/tickets/[id]/comment.js
import Busboy from "busboy";
export const config = { runtime: "nodejs" };

/* ---- cookie helpers (same cookie format you already use) ---- */
const COOKIE_NAME = "zd";
function parseCookies(req) {
  const header = req.headers.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [k, v] = part.split("=").map(s => s && s.trim());
    if (!k) return acc;
    acc[k] = decodeURIComponent(v || "");
    return acc;
  }, {});
}
function getSessionFromCookie(req) {
  const cookies = parseCookies(req);
  const raw = cookies[COOKIE_NAME];
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
const zendeskBaseUrl = (sub) => `https://${sub}.zendesk.com`;
const authHeader = (email, token) => ({
  Authorization: "Basic " + Buffer.from(`${email}/token:${token}`).toString("base64"),
});

/* ---- parse multipart with busboy ---- */
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = [];

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        files.push({
          fieldname,
          filename: filename || "attachment",
          mimetype: mimeType || "application/octet-stream",
          buffer: Buffer.concat(chunks),
        });
      });
      file.on("error", reject);
    });

    busboy.on("field", (name, value) => { fields[name] = value; });
    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fields, files }));
    req.pipe(busboy);
  });
}

/* ---- Zendesk helpers ---- */
async function zdUpload({ session, filename, mimetype, buffer }) {
  const url = `${zendeskBaseUrl(session.subdomain)}/api/v2/uploads.json?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...authHeader(session.email, session.token), "Content-Type": mimetype, Accept: "application/json" },
    body: buffer,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw Object.assign(new Error(`Upload ${res.status}: ${(json && (json.error || json.description)) || res.statusText}`),
      { status: res.status, details: json || { raw: text } });
  }
  const token = json?.upload?.token;
  if (!token) throw new Error("No upload token returned by Zendesk.");
  return token;
}

async function zdAddComment({ session, ticketId, body, html_body, isPublic, uploads }) {
  const url = `${zendeskBaseUrl(session.subdomain)}/api/v2/tickets/${encodeURIComponent(ticketId)}.json`;
  const payload = { ticket: { comment: { ...(html_body ? { html_body } : { body }), public: !!isPublic, ...(uploads.length ? { uploads } : {}) } } };
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...authHeader(session.email, session.token), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw Object.assign(new Error(`Zendesk ${res.status}: ${(json && (json.error || json.description)) || res.statusText}`),
      { status: res.status, details: json || { raw: text } });
  }
  return json || {};
}

/* ---- Handler ---- */
export default async function handler(req, res) {
  // allow preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed: use POST" });
  }

  try {
    const session = getSessionFromCookie(req);
    if (!session?.email || !session?.token || !session?.subdomain) {
      return res.status(401).json({ error: "Not authenticated (missing zd cookie)" });
    }

    const id = req.query?.id;
    if (!id) return res.status(400).json({ error: "Missing ticket id" });

    const { fields, files } = await parseMultipart(req);

    const rawBody = (fields.body || "").toString().trim();
    const html_body = fields.html_body ? String(fields.html_body) : "";
    const isPublic = String(fields.isPublic ?? "true").toLowerCase() === "true";

    // uploads
    const tokens = [];
    for (const f of files) {
      if (f.buffer?.length) tokens.push(await zdUpload({ session, filename: f.filename, mimetype: f.mimetype, buffer: f.buffer }));
    }

    const finalBody = rawBody || (tokens.length ? "Attachment(s) uploaded." : "");
    if (!finalBody && !html_body) {
      return res.status(400).json({ error: "Empty message and no attachments." });
    }

    const result = await zdAddComment({ session, ticketId: id, body: finalBody, html_body, isPublic, uploads: tokens });
    return res.status(200).json(result);
  } catch (err) {
    console.error("comment handler error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Server error", details: err.details || null });
  }
}
