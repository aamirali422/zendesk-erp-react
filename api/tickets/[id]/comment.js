// api/tickets/[id]/comment.js
import { requireSession, zdFetch } from "../../../src/server-lib/zd.js";
import formidable from "formidable";

/**
 * NOTE: For simplicity, this posts a comment WITHOUT handling Zendesk file uploads.
 * The front-end already ensures a non-empty body (fallback "Attachment(s) uploaded.").
 * If you need real attachments, you'd upload each file to /api/v2/uploads.json and pass "uploads" tokens.
 */

export const config = {
  api: {
    bodyParser: false, // let formidable parse
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  // /api/tickets/{id}/comment
  const parts = req.url.split("/api/tickets/")[1].split("/");
  const id = parts[0];

  try {
    const session = requireSession(req);

    const form = formidable({});
    const { fields/*, files*/ } = await new Promise((resolve, reject) => {
      form.parse(req, (err, flds, fls) => (err ? reject(err) : resolve({ fields: flds, files: fls })));
    });

    const body = fields.body || "";
    const isPublic = String(fields.isPublic || "true") === "true";

    const payload = {
      ticket: {
        comment: {
          body: String(body || "Attachment(s) uploaded."),
          public: isPublic,
          // uploads: [] // implement if you later upload files to /uploads.json
        }
      }
    };

    const data = await zdFetch(session, `/api/v2/tickets/${id}.json`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" }
    });

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true, result: data }));
  } catch (err) {
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || "Add comment failed" }));
  }
}
