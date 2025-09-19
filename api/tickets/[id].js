import axios from "axios";
import { getSession, authHeader } from "../_session.js";

export default async function handler(req, res) {
  const sess = getSession(req, res);
  if (!sess) return;

  const base = `https://${sess.subdomain}.zendesk.com`;
  const headers = { Authorization: authHeader(sess.email, sess.apiToken) };

  try {
    if (req.method === "GET") {
      const url = `${base}/api/v2/tickets/${req.query.id}.json?include=users,organizations,groups`;
      const zd = await axios.get(url, { headers });
      return res.json(zd.data);
    }

    if (req.method === "PUT") {
      const url = `${base}/api/v2/tickets/${req.query.id}.json`;
      const zd = await axios.put(url, req.body, { headers });
      return res.json(zd.data);
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (err) {
    const status = err?.response?.status || 500;
    res.status(status).json({ ok: false, error: err?.response?.data || err.message });
  }
}
