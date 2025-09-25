export const config = { runtime: "nodejs" };
import Busboy from "busboy";
import { getSession } from "../../_session.js";
import { baseUrl, authHeader } from "../../_zd.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "Not authenticated" });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  // Parse multipart form-data via Busboy
  const { fields, files } = await parseMultipart(req);

  const isPublic = String(fields.isPublic) === "true";
  const bodyText = (fields.html_body ? "" : (fields.body || "")).trim();
  const htmlBody = fields.html_body || null;

  // Upload attachments to Zendesk to get tokens
  const tokens = [];
  for (const f of files) {
    const upRes = await fetch(`${baseUrl(s.subdomain)}/api/v2/uploads.json?filename=${encodeURIComponent(f.filename)}`, {
      method: "POST",
      headers: {
        ...authHeader(s),
        "Content-Type": f.mimetype || "application/octet-stream",
      },
      body: f.buffer,
    });
    const upText = await upRes.text();
    if (!upRes.ok) {
      return res.status(upRes.status).json({ error: "Upload failed", details: safeJson(upText) });
    }
    const upJson = safeJson(upText);
    tokens.push(upJson?.upload?.token);
  }

  // Construct payload; Zendesk requires non-empty body for comment
  const comment = {
    ...(htmlBody ? { html_body: htmlBody } : { body: bodyText || (tokens.length ? "Attachment(s) uploaded." : "") }),
    public: isPublic,
    ...(tokens.length ? { uploads: tokens } : {})
  };

  try {
    const putRes = await fetch(`${baseUrl(s.subdomain)}/api/v2/tickets/${id}.json`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeader(s),
      },
      body: JSON.stringify({ ticket: { comment } }),
    });
    const putText = await putRes.text();
    if (!putRes.ok) {
      return res.status(putRes.status).json({ error: "Comment failed", details: safeJson(putText) });
    }
    const json = safeJson(putText) || {};
    res.status(200).json(json);
  } catch (e) {
    res.status(500).json({ error: e.message || "Comment failed" });
  }
}

/** Helpers */
function safeJson(txt) { try { return JSON.parse(txt); } catch { return { raw: txt }; } }

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = [];
    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        files.push({ fieldname: name, filename, mimetype: mimeType, buffer: Buffer.concat(chunks) });
      });
    });
    busboy.on("field", (name, val) => { fields[name] = val; });
    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fields, files }));
    req.pipe(busboy);
  });
}
