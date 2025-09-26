// api/tickets/[id]/comment.js
export const config = { api: { bodyParser: false } }; // Busboy handles multipart

import Busboy from "busboy";
import { Buffer } from "node:buffer";
import { getSessionFromCookie } from "../../../src/server-lib/cookies.js";

function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

/** Parse multipart form and collect small files into memory (Vercel limit applies). */
function parseMultipart(req, { maxFileBytes = 25 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = []; // { filename, mimetype, buffer }

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (_name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      let size = 0;

      file.on("data", (d) => {
        size += d.length;
        if (size > maxFileBytes) {
          file.unpipe(); // stop collecting, discard rest
          file.resume();
          reject(new Error(`File too large: ${filename}`));
          return;
        }
        chunks.push(d);
      });

      file.on("end", () => {
        files.push({
          filename,
          mimetype: mimeType || "application/octet-stream",
          buffer: Buffer.concat(chunks),
        });
      });
    });

    busboy.once("error", reject);
    busboy.once("finish", () => resolve({ fields, files }));
    req.pipe(busboy);
  });
}

/** Upload a single file to Zendesk Uploads API and return its token. */
async function uploadToZendesk({ base, auth, file }) {
  const upUrl = `${base}/api/v2/uploads.json?filename=${encodeURIComponent(file.filename)}`;
  const resp = await fetch(upUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": file.mimetype || "application/octet-stream",
      Accept: "application/json",
    },
    body: file.buffer,
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Upload failed (${resp.status}): ${text || "no body"}`);
  }
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Upload: invalid JSON response.");
  }
  const token = json?.upload?.token;
  if (!token) throw new Error("Upload: token missing in response.");
  return token;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const session = getSessionFromCookie(req);
    if (!session?.email || !session?.token || !session?.subdomain) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing ticket id" });

    // 1) parse fields + files
    const { fields, files } = await parseMultipart(req);
    const rawBody = (fields.body || "").trim();
    const htmlBody = (fields.html_body || "").trim();
    const isPublic = String(fields.isPublic ?? "true") === "true";

    // fallback text if only attachments
    const commentText = rawBody || htmlBody || (files.length ? "Attachment(s) uploaded." : "");
    if (!commentText) return res.status(400).json({ error: "Empty comment." });

    const base = zendeskBaseUrl(session.subdomain);
    const auth = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");

    // 2) upload each file to get tokens
    const tokens = [];
    for (const file of files) {
      const tok = await uploadToZendesk({ base, auth, file });
      tokens.push(tok);
    }

    // 3) add the comment with uploads
    const payload = {
      ticket: {
        comment: {
          ...(htmlBody ? { html_body: htmlBody } : { body: commentText }),
          public: isPublic,
          ...(tokens.length ? { uploads: tokens } : {}),
        },
      },
    };

    const zUrl = `${base}/api/v2/tickets/${encodeURIComponent(id)}.json`;
    const zResp = await fetch(zUrl, {
      method: "PUT",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await zResp.text();
    if (!zResp.ok) {
      return res.status(zResp.status).json({
        error: text || `Zendesk error ${zResp.status}`,
        code: "ZENDESK_ERROR",
      });
    }

    // return parsed JSON if possible
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Comment handler failed",
      code: "FUNCTION_INVOCATION_FAILED",
    });
  }
}
