export const config = { runtime: "nodejs" };
import { getSession } from "./_session.js";
import { zdFetch } from "./_zd.js";

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "Not authenticated" });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.searchParams.get("path");
  if (!path) return res.status(400).json({ error: "Missing ?path" });

  try {
    const data = await zdFetch(s, path);
    res.status(200).json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.body });
  }
}
