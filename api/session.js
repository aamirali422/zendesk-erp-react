// api/session.js

export default async function handler(req, res) {
  const header = req.headers.cookie || "";
  const match = header.split(";").find(p => p.trim().startsWith("zd_session="));
  if (!match) return res.status(200).json({ ok: false });

  try {
    const raw = decodeURIComponent(match.split("=")[1]);
    const session = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
    return res.json({ ok: true, user: { email: session.email }, subdomain: session.subdomain });
  } catch {
    return res.json({ ok: false });
  }
}
