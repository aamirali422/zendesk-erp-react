// api/tickets/[id]/comment.js
import { sessionFromReq, zdUploadFile } from "../../../_utils/zd.js";
import formidable from "formidable";
import { readFile } from "fs/promises";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const session = sessionFromReq(req);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: true, maxFileSize: 50 * 1024 * 1024 });
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const body = (fields.body && String(fields.body)) || "Attachment(s) uploaded.";
    const isPublic = String(fields.isPublic || "true").toLowerCase() === "true";
    const fileArray = Array.isArray(files.files) ? files.files : files.files ? [files.files] : [];

    const uploadTokens = [];
    for (const f of fileArray) {
      const buf = await readFile(f.filepath);
      const token = await zdUploadFile(session, f.originalFilename || "upload.bin", buf);
      if (token) uploadTokens.push(token);
    }

    const payload = {
      ticket: {
        comment: {
          body,
          public: isPublic,
          ...(uploadTokens.length ? { uploads: uploadTokens } : {})
        }
      }
    };

    const url = `https://${session.subdomain}.zendesk.com/api/v2/tickets/${id}.json`;
    const auth = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");

    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) return res.status(resp.status).json({ error: await resp.text() });
    return res.json(await resp.json());
  } catch (e) {
    return res.status(500).json({ error: e.message || "Upload/comment failed" });
  }
}
