export const config = { runtime: "nodejs" };
import { getSession } from "../../_session.js";
import { zdFetch } from "../../_zd.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method Not Allowed");
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "Not authenticated" });

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const include = req.query.include || "users";
  const inline = req.query.inline === "true" ? "&include_inline_images=true" : "";
  try {
    const data = await zdFetch(s, `/api/v2/tickets/${id}/comments.json?include=${encodeURIComponent(include)}${inline}`);
    res.status(200).json(data);
  } catch (e) {
    res.status(e.status || 500).json({ error: e.message, details: e.body });
  }
}
