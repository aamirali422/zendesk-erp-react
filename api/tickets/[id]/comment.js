// api/tickets/[id]/comment.js
import { apiBase, basicAuthHeader } from "../../../_utils/zendesk.js";
import formidable from "formidable";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ticket id" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    // parse multipart form (body, html_body, isPublic, files[])
    const form = formidable({ multiples: true });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
    });

    const body = String(fields.body || "").trim();
    const html_body = fields.html_body ? String(fields.html_body) : undefined;
    const isPublic = String(fields.isPublic || "true") === "true";

    // (A) If there are attachments, upload them first to get upload token(s)
    let uploads = [];
    const fileList = []
      .concat(files.files || [])
      .filter(Boolean); // normalize to array

    for (const f of fileList) {
      const buffer = await fsReadFile(f.filepath);
      const upUrl = `${apiBase()}/uploads.json?filename=${encodeURIComponent(f.originalFilename || f.newFilename)}`;
      const upRes = await fetch(upUrl, {
        method: "POST",
        headers: { "Content-Type": "application/binary", ...basicAuthHeader() },
        body: buffer,
      });
      const upText = await upRes.text();
      if (!upRes.ok) {
        return res.status(upRes.status).json({ error: upText || "Upload failed" });
      }
      const upJson = JSON.parse(upText);
      uploads.push(upJson.upload?.token);
    }

    // (B) Add the comment
    const payload = {
      ticket: {
        comment: {
          body: body || "Attachment(s) uploaded.",
          public: isPublic,
          ...(html_body ? { html_body } : {}),
          ...(uploads.length ? { uploads } : {}),
        },
      },
    };

    const url = `${apiBase()}/tickets/${id}.json`;
    const r = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...basicAuthHeader() },
      body: JSON.stringify(payload),
    });
    const ct = r.headers.get("content-type") || "";
    const text = await r.text();
    if (ct.includes("application/json")) return res.status(r.status).json(JSON.parse(text));
    return res.status(r.status).json({ error: text || "Non-JSON from Zendesk" });
  } catch (e) {
    console.error("Post comment error:", e);
    return res.status(500).json({ error: e.message || "Post comment error" });
  }
}

// small helper
import { readFile } from "fs/promises";
async function fsReadFile(p) { return readFile(p); }
