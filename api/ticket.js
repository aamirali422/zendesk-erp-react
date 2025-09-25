// api/tickets.js
import Busboy from "busboy";

// adjust this import path based on your repo structure
import { requireSession, zendeskBaseUrl } from "../src/server-lib/zd.js";

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    try {
      const busboy = Busboy({ headers: req.headers });
      const fields = {};
      const files = [];

      busboy.on("field", (name, val) => { fields[name] = val; });

      busboy.on("file", (name, file, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        file.on("data", (d) => chunks.push(d));
        file.on("end", () => {
          files.push({
            field: name,
            filename,
            mime: mimeType || "application/octet-stream",
            buffer: Buffer.concat(chunks),
          });
        });
      });

      busboy.on("finish", () => resolve({ fields, files }));
      busboy.on("error", reject);
      req.pipe(busboy);
    } catch (e) {
      reject(e);
    }
  });
}

export default async function handler(req, res) {
  try {
    const session = requireSession(req); // reads your signed cookie
    const base = zendeskBaseUrl(session.subdomain);
    const auth = "Basic " + Buffer.from(`${session.email}/token:${session.token}`).toString("base64");

    const url = new URL(req.url, "http://localhost"); // base doesn’t matter
    const id = url.searchParams.get("id");
    const isCommentPost = url.searchParams.get("comment") === "1";
    const isCommentsList = url.searchParams.get("comments") === "1";

    // ---------- POST /api/tickets/:id/comment ----------
    if (isCommentPost) {
      if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
      if (!id) return res.status(400).json({ error: "Missing ticket id" });

      // 1) Parse multipart
      const { fields, files } = await parseMultipart(req);
      const bodyText = (fields.body || "").trim();
      const htmlBody = fields.html_body ? String(fields.html_body) : null;
      const isPublic = String(fields.isPublic) === "true";

      // 2) Uploads -> tokens
      const tokens = [];
      for (const f of files) {
        const upUrl = `${base}/api/v2/uploads.json?filename=${encodeURIComponent(f.filename)}`;
        const upRes = await fetch(upUrl, {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": f.mime || "application/octet-stream",
            Accept: "application/json",
          },
          body: f.buffer,
        });
        const upText = await upRes.text();
        if (!upRes.ok) return res.status(upRes.status).send(upText || "Upload failed");
        const up = upText ? JSON.parse(upText) : {};
        if (!up?.upload?.token) return res.status(502).json({ error: "Upload token missing", details: up });
        tokens.push(up.upload.token);
      }

      // 3) PUT ticket with comment
      const comment = {
        public: !!isPublic,
        ...(htmlBody ? { html_body: htmlBody } : { body: bodyText || (tokens.length ? "Attachment(s) uploaded." : "") }),
        ...(tokens.length ? { uploads: tokens } : {}),
      };
      if (!comment.body && !comment.html_body) {
        return res.status(400).json({ error: "Empty message. Provide body/html_body or at least one file." });
      }

      const putUrl = `${base}/api/v2/tickets/${encodeURIComponent(id)}.json`;
      const payload = { ticket: { comment } };
      const r = await fetch(putUrl, {
        method: "PUT",
        headers: { Authorization: auth, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).send(text || r.statusText);

      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text || "{}");
    }

    // ---------- GET /api/tickets/:id/comments ----------
    if (isCommentsList) {
      if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
      if (!id) return res.status(400).json({ error: "Missing ticket id" });

      const include = req.query?.include || "users";
      const inline = req.query?.inline === "true" ? "&include_inline_images=true" : "";
      const zurl = `${base}/api/v2/tickets/${encodeURIComponent(id)}/comments.json?include=${encodeURIComponent(include)}${inline}`;

      const r = await fetch(zurl, { headers: { Accept: "application/json", Authorization: auth } });
      const text = await r.text();
      if (!r.ok) return res.status(r.status).send(text || r.statusText);

      res.setHeader("Content-Type", "application/json");
      return res.status(200).send(text || "{}");
    }

    // ---------- GET / PUT /api/tickets/:id ----------
    if (id) {
      // GET details (with include)
      if (req.method === "GET") {
        const include = req.query?.include || "users,organizations,groups";
        const zurl = `${base}/api/v2/tickets/${encodeURIComponent(id)}.json?include=${encodeURIComponent(include)}`;

        const r = await fetch(zurl, { headers: { Accept: "application/json", Authorization: auth } });
        const text = await r.text();
        if (!r.ok) return res.status(r.status).send(text || r.statusText);

        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(text || "{}");
      }

      // PUT update
      if (req.method === "PUT") {
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const bodyStr = Buffer.concat(chunks).toString("utf8") || "{}";

        const zurl = `${base}/api/v2/tickets/${encodeURIComponent(id)}.json`;
        const r = await fetch(zurl, {
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: auth },
          body: bodyStr,
        });
        const text = await r.text();
        if (!r.ok) return res.status(r.status).send(text || r.statusText);

        res.setHeader("Content-Type", "application/json");
        return res.status(200).send(text || "{}");
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    // If we got here, the request didn’t match expected patterns.
    return res.status(400).json({ error: "Bad request" });
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message || "Server error" });
  }
}
