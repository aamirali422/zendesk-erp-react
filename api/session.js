// api/session.js
const { readSession } = require("./_utils/session");

module.exports = async (req, res) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: "No session" });
  return res.status(200).json({ ok: true, subdomain: s.subdomain, email: s.email });
};
