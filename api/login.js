export const config = { runtime: "nodejs20.x" }; // force Node runtime

import axios from "axios";
import { setSessionCookie, authHeader } from "./_session.js";

// Safe env reader (works even if process is undefined)
const env = (k) =>
  (typeof process !== "undefined" && process.env && process.env[k]) ? process.env[k] : "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const email = (req.body?.email || env("ZENDESK_EMAIL") || "").trim();
    const token = (req.body?.token || env("ZENDESK_TOKEN") || "").trim();
    const subdomain = (req.body?.subdomain || env("ZENDESK_SUBDOMAIN") || "").trim();
    if (!email || !token || !subdomain) {
      return res.status(400).json({ ok: false, error: "Missing email, token, or subdomain." });
    }

    const base = `https://${subdomain}.zendesk.com`;
    const me = await axios.get(`${base}/api/v2/users/me.json`, {
      headers: { Authorization: authHeader(email, token) },
    });

    if (!me.data?.user) {
      return res.status(401).json({ ok: false, error: "Auth failed" });
    }

    // IMPORTANT: pass req so _session can decide SameSite/Secure based on host
    setSessionCookie(req, res, { email, apiToken: token, subdomain });

    return res.json({
      ok: true,
      user: { id: me.data.user.id, name: me.data.user.name, email },
      subdomain,
    });
  } catch (err) {
    const status = err?.response?.status || 500;
    return res.status(status).json({ ok: false, error: err?.response?.data || err.message });
  }
}
