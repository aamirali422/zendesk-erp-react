// /api/tickets/[id]/comment.js
import Busboy from "busboy";
import { getSessionFromCookie } from "../../src/server-lib/cookies.js";
import { zendeskBaseUrl } from "../../src/server-lib/zd.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  // Get session (email/token/subdomain) from cookie
  const session = getSessionFromCookie(req);
  if (!session) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "Not authenticated" }));
  }

  const id = req.url.split("/api/tickets/")[1].split("/comment")[0];

  // Parse multipart with Busboy
  const busboy = Busboy({ headers: req.headers });
  const fields = {};
  const files = []; // { filename, mime, buffer }

  busboy.on("file", (_name, file, info) => {
    const { filename, mimeType } = info;
    const chunks = [];
    file.on("data", (d) => chunks.push(d));
    file.on("end", () => {
      files.push({ filename, mime: mimeType, buffer: Buffer.concat(chunks) });
    });
  });

  busboy.on("field", (name, val) => {
    fields[name] = val;
  });

  busboy.on("finish", async () => {
    try {
      const base = zendeskBaseUrl(session.subdomain);
      const auth = "Basic " + Buffer.from(`${session.email}/token:${session.token}`).toString("base64");

      // 1) Upload each file to Zendesk Uploads API to collect tokens
      const uploads = [];
      for (const f of files) {
        const up = await fetch(`${base}/api/v2/uploads.json?filename=${encodeURIComponent(f.filename)}`, {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": f.mime || "application/octet-stream",
          },
          body: f.buffer,
        });
        const upText = await up.text();
        if (!up.ok) {
          res.statusCode = up.status;
          return res.end(JSON.stringify({ error: "Upload failed", details: upText }));
        }
        const upJson = JSON.parse(upText || "{}");
        uploads.push(upJson?.upload?.token);
      }

      // 2) Build the comment payload
      const body = (fields.body || "").trim() || "Attachment(s) uploaded.";
      const isPublic = String(fields.isPublic) === "true";
      const payload = {
        ticket: {
          comment: {
            ...(fields.html_body ? { html_body: fields.html_body } : { body }),
            public: isPublic,
            ...(uploads.length ? { uploads } : {}),
          },
        },
      };

      // 3) PUT ticket update
      const put = await fetch(`${base}/api/v2/tickets/${encodeURIComponent(id)}.json`, {
        method: "PUT",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const putText = await put.text();
      if (!put.ok) {
        res.statusCode = put.status;
        return res.end(JSON.stringify({ error: "Ticket update failed", details: putText }));
      }

      res.setHeader("Content-Type", "application/json");
      return res.end(putText || "{}");
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err?.message || "Server error" }));
    }
  });

  req.pipe(busboy);
}
