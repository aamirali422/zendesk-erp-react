import axios from "axios";
import multiparty from "multiparty";
import { getSession, authHeader } from "../../_session.js";

export const config = { api: { bodyParser: false } };

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const sess = getSession(req, res);
  if (!sess) return;

  try {
    const { fields, files } = await parseForm(req);
    const body = fields.body?.[0] || "";
    const html_body = fields.html_body?.[0];
    const isPublic = (fields.isPublic?.[0] || "true") === "true";

    const base = `https://${sess.subdomain}.zendesk.com`;
    const headers = { Authorization: authHeader(sess.email, sess.apiToken) };

    const uploads = [];
    for (const f of (files.files || [])) {
      const file = f;
      const data = await axios.post(
        `${base}/api/v2/uploads.json?filename=${encodeURIComponent(file.originalFilename)}`,
        // Multiparty gives us a path. Stream it.
        require("fs").createReadStream(file.path),
        { headers: { ...headers, "Content-Type": file.headers["content-type"] || "application/octet-stream" } }
      );
      uploads.push(data.data.upload.token);
    }

    const payload = {
      ticket: {
        comment: {
          ...(html_body ? { html_body } : { body: body || "Attachment(s) uploaded." }),
          public: isPublic,
          ...(uploads.length ? { uploads } : {}),
        },
      },
    };

    const put = await axios.put(`${base}/api/v2/tickets/${req.query.id}.json`, payload, { headers });
    res.json(put.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ ok: false, error: err?.response?.data || err.message });
  }
}
