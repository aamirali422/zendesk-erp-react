// api/tickets/[id]/comment.js
export const config = { runtime: "nodejs20.x" };

import axios from "axios";
import formidable from "formidable";
import { readSession, authHeader } from "../../_session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const sess = readSession(req, res);
  if (!sess) return;

  try {
    // Parse multipart
    const form = formidable({ multiples: true, keepExtensions: true });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => (err ? reject(err) : resolve({ fields, files })));
    });

    const body = fields.body?.toString() || "Attachment(s) uploaded.";
    const html_body = fields.html_body?.toString();
    const isPublic = (fields.isPublic ?? "true").toString() === "true";

    const base = `https://${sess.subdomain}.zendesk.com`;
    const tokens = [];

    // Normalize to an array of file objects
    const fileList = []
      .concat(files.files || [])
      .concat(files["files[]"] || []);

    for (const f of fileList) {
      if (!f || !f.filepath) continue;
      const up = await axios.post(
        `${base}/api/v2/uploads.json?filename=${encodeURIComponent(f.originalFilename || f.newFilename || "file")}`,
        // Send the file as a stream
        require("fs").createReadStream(f.filepath),
        {
          headers: {
            Authorization: authHeader(sess.email, sess.apiToken),
            "Content-Type": f.mimetype || "application/octet-stream",
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );
      tokens.push(up.data.upload.token);
    }

    // Add the comment
    const payload = {
      ticket: {
        comment: {
          ...(html_body ? { html_body } : { body }),
          public: isPublic,
          ...(tokens.length ? { uploads: tokens } : {}),
        },
      },
    };

    const zdResp = await axios.put(
      `${base}/api/v2/tickets/${req.query.id}.json`,
      payload,
      {
        headers: {
          Authorization: authHeader(sess.email, sess.apiToken),
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(zdResp.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err.message;
    console.error("POST comment error:", status, data);
    res.status(status).json({ ok: false, error: data });
  }
}
