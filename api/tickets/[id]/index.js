export const config = { runtime: "nodejs" };

import Busboy from "busboy";

const COOKIE_NAME = "zd";
const parseCookies = (req) =>
  (req.headers.cookie || "").split(";").reduce((a, p) => {
    const [k, v] = p.split("=").map(s => s && s.trim());
    if (!k) return a;
    a[k] = decodeURIComponent(v || "");
    return a;
  }, {});
function getSessionFromCookie(req) {
  const raw = parseCookies(req)[COOKIE_NAME];
  if (!raw) return null;
  try { return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")); }
  catch { return null; }
}
const base = (sub) => `https://${sub}.zendesk.com`;
const authHeader = (email, token) => ({
  Authorization: "Basic " + Buffer.from(`${email}/token:${token}`).toString("base64"),
  Accept: "application/json",
});

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = []; // { filename, mimetype, buffer }

    busboy.on("field", (name, val) => { fields[name] = val; });

    busboy.on("file", (name, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("limit", () => {}); // optional
      file.on("end", () => {
        files.push({ filename, mimetype: mimeType, buffer: Buffer.concat(chunks) });
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fields, files }));
    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = getSessionFromCookie(req);
  if (!session?.email || !session?.token || !session?.subdomain) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    const { fields, files } = await parseMultipart(req);
    const bodyText = (fields.body || "").trim();
    const html_body = fields.html_body;
    const isPublic = String(fields.isPublic) === "true";

    // 1) Upload attachments (if any) to Zendesk to get tokens
    const uploadTokens = [];
    for (const f of files) {
      const upUrl = `${base(session.subdomain)}/api/v2/uploads.json?filename=${encodeURIComponent(f.filename)}`;
      const up = await fetch(upUrl, {
        method: "POST",
        headers: {
          ...authHeader(session.email, session.token),
          "Content-Type": f.mimetype || "application/octet-stream",
        },
        body: f.buffer,
      });
      const upText = await up.text();
      let upJson; try { upJson = upText ? JSON.parse(upText) : {}; } catch { upJson = { raw: upText }; }
      if (!up.ok) return res.status(up.status).json(upJson);
      uploadTokens.push(upJson.upload.token);
    }

    // Ensure a non-empty body if only attachments
    const safeBody = bodyText || (uploadTokens.length ? "Attachment(s) uploaded." : "");
    if (!safeBody) return res.status(400).json({ error: "Empty body" });

    // 2) Add the comment to the ticket
    const payload = {
      ticket: {
        comment: {
          ...(html_body ? { html_body } : { body: safeBody }),
          public: isPublic,
          ...(uploadTokens.length ? { uploads: uploadTokens } : {}),
        }
      }
    };

    const url = `${base(session.subdomain)}/api/v2/tickets/${encodeURIComponent(id)}.json`;
    const r = await fetch(url, {
      method: "PUT",
      headers: { ...authHeader(session.email, session.token), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const t = await r.text();
    let j; try { j = t ? JSON.parse(t) : {}; } catch { j = { raw: t }; }
    return r.ok ? res.status(200).json(j) : res.status(r.status).json(j);
  } catch (e) {
    console.error("comment handler error:", e);
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
