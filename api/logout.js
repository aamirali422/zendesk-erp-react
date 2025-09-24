import { clearSession } from "./_utils/session.js";

export default async function handler(_req, res) {
  clearSession(res);
  res.status(200).json({ ok: true });
}
