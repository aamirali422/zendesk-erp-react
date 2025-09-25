// api/tickets/[id]/comment.js
export const config = { api: { bodyParser: false } }; // let Busboy handle multipart

import Busboy from "busboy";
import { Buffer } from "node:buffer";
// ⬅️ FIXED: this file is in api/tickets/[id]/comment.js, so we need to go up THREE levels.
import { getSessionFromCookie } from "../../../src/server-lib/cookies.js";

function zendeskBaseUrl(subdomain) {
  return `https://${subdomain}.zendesk.com`;
}

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields = {};
    const files = [];

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (_name, file /* stream */, _info) => {
      // We are not handling attachments in this minimal handler; drain stream.
      file.resume();
    });

    busboy.once("error", reject);
    busboy.once("finish", () => resolve({ fields, files }));

    req.pipe(busboy);
  });
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

    const { fields } = await parseForm(req);
    const body = (fields.body || "").trim();
    const isPublic = String(fields.isPublic ?? "true") === "true";
    if (!body) return res.status(400).json({ error: "Empty body" });

    // Minimal: send text comment (attachments need a separate upload flow)
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
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await zResp.text();
    if (!zResp.ok) {
      // Surface Zendesk’s response to the client for easier debugging
      return res.status(zResp.status).json({
        error: text || `Zendesk error ${zResp.status}`,
        code: "ZENDESK_ERROR",
      });
    }

    // Return Zendesk JSON if possible
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    // Extra details help when you check Vercel logs
    return res.status(500).json({
      error: err?.message || "Comment handler failed",
      code: "FUNCTION_INVOCATION_FAILED",
    });
  }
}
