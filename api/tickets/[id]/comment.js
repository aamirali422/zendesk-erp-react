// api/tickets/[id]/comment.js
// Runtime: Node.js (not edge) because we parse multipart form data.
export const config = { api: { bodyParser: false } }; // let Busboy read the stream

import Busboy from "busboy";
import { Buffer } from "node:buffer";
import { getSessionFromCookie } from "../../src/server-lib/cookies.js";

/** Build Zendesk base url from subdomain */
function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

/** Parse multipart/form-data into { fields, files[] } (we ignore files for now) */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = []; // not used here (attachments step is more complex)

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    // If you need attachments later, collect file streams here
    busboy.on("file", (name, file /* stream */, info) => {
      // Example: files.push({ name: info.filename, mime: info.mimeType, stream: file })
      // For now we just drain the stream to keep things simple:
      file.resume();
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

  // auth/session from cookie
  const session = getSessionFromCookie(req);
  if (!session?.email || !session?.token || !session?.subdomain) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: "Missing ticket id" });

  try {
    const { fields /*, files*/ } = await parseForm(req);
    const body = (fields.body || "").trim();
    const isPublic = String(fields.isPublic || "true") === "true";

    if (!body) return res.status(400).json({ error: "Empty body" });

    // NOTE: attachments require a separate uploads flow in Zendesk.
    // This minimal handler sends a plain comment without attachments.
    const payload = {
      ticket: {
        comment: {
          body,
          public: isPublic,
        },
      },
    };

    const base = zendeskBaseUrl(session.subdomain);
    const zUrl = `${base}/api/v2/tickets/${encodeURIComponent(id)}.json`;
    const auth = Buffer.from(`${session.email}/token:${session.token}`).toString("base64");

    const zResp = await fetch(zUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await zResp.text();
    if (!zResp.ok) {
      return res.status(zResp.status).json({ error: text || `Zendesk error ${zResp.status}` });
    }

    // Pass Zendesk JSON through
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    return res.status(500).json({ error: err?.message || "Comment handler failed" });
  }
}
