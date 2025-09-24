// api/logout.js
const { serializeCookie } = require("./_utils/cookies");

module.exports = async (req, res) => {
  // clear cookie
  res.setHeader(
    "Set-Cookie",
    serializeCookie("zd_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 0,
    })
  );
  return res.status(200).json({ ok: true });
};
