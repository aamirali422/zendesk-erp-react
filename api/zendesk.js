// api/zendesk.js
export const config = { runtime: "nodejs20.x" };

import axios from "axios";
import { readSession, authHeader } from "./_session.js";

export default async function handler(req, res) {
  // Only GET/POST/PUT/DELETE passthroughs supported
  if (!["GET", "POST", "PUT", "DELETE"].includes(req.method)) {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const sess = readSession(req, res);
  if (!sess) return; // readSession already sent 401 JSON

  try {
    const path = req.query?.path;
    if (!path || !String(path).startsWith("/api/v2")) {
      return res.status(400).json({ ok: false, error: "Missing or invalid ?path=/api/v2/..." });
    }

    const base = `https://${sess.subdomain}.zendesk.com`;
    const url = `${base}${path}`;

    const headers = {
      Authorization: authHeader(sess.email, sess.apiToken),
      "Content-Type": "application/json",
    };

    let zdResp;
    if (req.method === "GET") {
      zdResp = await axios.get(url, { headers });
    } else if (req.method === "POST") {
      zdResp = await axios.post(url, req.body, { headers });
    } else if (req.method === "PUT") {
      zdResp = await axios.put(url, req.body, { headers });
    } else if (req.method === "DELETE") {
      zdResp = await axios.delete(url, { headers });
    }

    res.status(zdResp.status).json(zdResp.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err.message;
    res.status(status).json({ ok: false, error: data });
  }
}
