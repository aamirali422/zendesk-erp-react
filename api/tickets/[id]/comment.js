// api/tickets/[id]/comment.js
import Busboy from "busboy";

// --- Vercel runtime ---
export const config = { runtime: "nodejs" };

/* -------------------- Cookie helpers (match your server-lib) -------------------- */
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

function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

function authHeaderBasic(email, token) {
  const basic = Buffer.from(`${email}/token:${token}`).toString("base64");
  return { Authorization: `Basic ${basic}` };
}

/* -------------------- File parser (Busboy) -------------------- */
async function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });

    const fields = {};
    const files = []; // { fieldname, filename, mimetype, buffer }

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("limit", () => {
        reject(new Error("File too large"));
      });
      file.on("end", () => {
        files.push({
          fieldname,
          filename,
          mimetype: mimeType || "application/octet-stream",
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("field", (name, value) => {
      // keep last value if multiple with same name
      fields[name] = value;
    });

    busboy.on("error", (err) => reject(err));

    busboy.on("finish", () => resolve({ fields, files }));

    req.pipe(busboy);
  });
}

/* -------------------- Upload a single file to Zendesk -------------------- */
async function zendeskUpload({ session, filename, mimetype, buffer }) {
  const base = zendeskBaseUrl(session.subdomain);
  const url = `${base}/api/v2/uploads.json?filename=${encodeURIComponent(filename)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeaderBasic(session.email, session.token),
      "Content-Type": mimetype || "application/octet-stream",
      "Accept": "application/json",
    },
    body: buffer,
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* noop */ }

  if (!res.ok) {
    const msg = (json && (json.error || json.description)) || res.statusText || "Upload failed";
    const err = new Error(`Zendesk Upload ${res.status}: ${msg}`);
    err.status = res.status;
    err.details = json || { raw: text };
    throw err;
  }

  const token = json?.upload?.token;
  if (!token) {
    throw new Error("Zendesk did not return an upload token.");
  }
  return token;
}

/* -------------------- Add comment to ticket -------------------- */
async function zendeskAddComment({ session, ticketId, body, html_body, isPublic, uploadTokens }) {
  const base = zendeskBaseUrl(session.subdomain);
  const url = `${base}/api/v2/tickets/${encodeURIComponent(ticketId)}.json`;

  const payload = {
    ticket: {
      comment: {
        ...(html_body ? { html_body } : { body }),
        public: !!isPublic,
        ...(uploadTokens && uploadTokens.length ? { uploads: uploadTokens } : {}),
      },
    },
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...authHeaderBasic(session.email, session.token),
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* noop */ }

  if (!res.ok) {
    const msg = (json && (json.error || json.description)) || res.statusText || "Ticket update failed";
    const err = new Error(`Zendesk ${res.status}: ${msg}`);
    err.status = res.status;
    err.details = json || { raw: text };
    throw err;
  }
  return json || {};
}

/* -------------------- Handler -------------------- */
export default async function handler(req, res) {
  // Optional CORS for safety (same-origin app usually doesn't need this)
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // If you need credentials + specific origin, set Access-Control-Allow-Origin to your domain.
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed: use POST" });
  }

  try {
    // Ensure session exists
    const session = getSessionFromCookie(req);
    if (!session || !session.email || !session.token || !session.subdomain) {
      return res.status(401).json({ error: "Not authenticated (missing zd cookie session)" });
    }

    const ticketId = req.query?.id;
    if (!ticketId) {
      return res.status(400).json({ error: "Missing ticket id in route" });
    }

    // Parse multipart/form-data
    const { fields, files } = await parseMultipart(req);

    const bodyRaw = (fields.body || "").toString();
    const html_body = fields.html_body ? fields.html_body.toString() : "";
    const isPublic = String(fields.isPublic || "true").toLowerCase() === "true";

    // Upload files (if any) to Zendesk
    const uploadTokens = [];
    for (const f of files) {
      // Ignore empty files defensively
      if (!f.buffer || !f.buffer.length) continue;
      const token = await zendeskUpload({
        session,
        filename: f.filename || "attachment",
        mimetype: f.mimetype || "application/octet-stream",
        buffer: f.buffer,
      });
      uploadTokens.push(token);
    }

    // Build safe comment body fallback (must not be empty if there are attachments)
    const trimmed = bodyRaw.trim();
    const finalBody = trimmed || (uploadTokens.length ? "Attachment(s) uploaded." : "");

    if (!finalBody && !html_body) {
      return res.status(400).json({ error: "Message body is empty and no attachments were provided." });
    }

    const result = await zendeskAddComment({
      session,
      ticketId,
      body: finalBody,
      html_body: html_body || "",
      isPublic,
      uploadTokens,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("comment.js error:", err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || "Server error", details: err.details || null });
  }
}
