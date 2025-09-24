// api/debug.js
module.exports = async (req, res) => {
  const hasEnv = !!(process.env.ZENDESK_EMAIL && process.env.ZENDESK_TOKEN && process.env.ZENDESK_SUBDOMAIN);
  const cookies = req.headers.cookie || "";
  res.status(200).json({
    ok: true,
    cookies: cookies ? "present" : "none",
    envConfigured: hasEnv
  });
};
