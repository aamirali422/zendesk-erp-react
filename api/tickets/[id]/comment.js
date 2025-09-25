export const config = { runtime: "nodejs" };

import Busboy from "busboy";

// Optional: if the app and API are the same origin, CORS isn’t required.
// Handling OPTIONS avoids 405 on preflight regardless.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req, res) {
  // Allow OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "text/plain", ...CORS_HEADERS });
    return res.end("Method Not Allowed");
  }

  try {
    // ——— read session from cookie (same code you already use) ———
    const { getSession } = await import("../_session.js");
    const { baseUrl, authHeader } = await import("../_zd.js");

    const s = getSession(req);
    if (!s) {
      res.writeHead(401, { "Content-Type": "application/json", ...CORS_HEADERS });
      return res.end(JSON.stringify({ error: "Not authenticated" }));
    }

    const id = req.query?.id;
    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json", ...CORS_HEADERS });
      return res.end(JSON.stringify({ error: "Missing id" }));
    }

    // ——— parse multipart form-data ———
    const { fields, files } = await parseMultipart(req);

    const isPublic = String(fields.isPublic) === "true";
    const htmlBody = fields.html_body || null;
    const bodyText = (fields.body || "").trim();

    // ——— upload files to Zendesk to get tokens ———
    const tokens = [];
    for (const f of files) {
      const up = await fetch(
        `${baseUrl(s.subdomain)}/api/v2/uploads.json?filename=${encodeURIComponent(f.filename)}`,
        {
          method: "POST",
          headers: {
            ...authHeader(s),
            "Content-Type": f.mimetype || "application/octet-stream",
            Accept: "application/json",
          },
          body: f.buffer,
        }
      );
      const upText = await up.text();
      if (!up.ok) {
        res.writeHead(up.status, { "Content-Type": "application/json", ...CORS_HEADERS });
        return res.end(JSON.stringify({ error: "Upload failed", details: safeJson(upText) }));
      }
      const upJson = safeJson(upText);
      tokens.push(upJson?.upload?.token);
    }

    // ——— create the comment via ticket PUT ———
    const comment = {
      ...(htmlBody ? { html_body: htmlBody } : { body: bodyText || (tokens.length ? "Attachment(s) uploaded." : "") }),
      public: isPublic,
      ...(tokens.length ? { uploads: tokens } : {}),
    };

    const putRes = await fetch(`${baseUrl(s.subdomain)}/api/v2/tickets/${id}.json`, {
      method: "PUT",
      headers: {
        ...authHeader(s),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ ticket: { comment } }),
    });
    const putText = await putRes.text();
    if (!putRes.ok) {
      res.writeHead(putRes.status, { "Content-Type": "application/json", ...CORS_HEADERS });
      return res.end(JSON.stringify({ error: "Comment failed", details: safeJson(putText) }));
    }

    res.writeHead(200, { "Content-Type": "application/json", ...CORS_HEADERS });
    return res.end(putText || "{}");
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json", ...CORS_HEADERS });
    return res.end(JSON.stringify({ error: e.message || "Unhandled error" }));
  }
}

// helpers
function safeJson(txt) { try { return JSON.parse(txt); } catch { return { raw: txt }; } }

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = [];
    busboy.on("file", (_name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => files.push({ filename, mimetype: mimeType, buffer: Buffer.concat(chunks) }));
    });
    busboy.on("field", (name, val) => { fields[name] = val; });
    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fields, files }));
    req.pipe(busboy);
  });
}
