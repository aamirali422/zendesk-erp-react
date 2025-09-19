/* eslint-env node */
import "dotenv/config";
import process from "node:process";  
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "node:buffer";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

/* --------------------------- Middleware --------------------------- */
const allowedOrigins = [
  "http://localhost:5173",                   // vite dev
  "https://zendesk-erp-react-cqhz.vercel.app" // your vercel frontend
];

app.use(
  cors({
    origin: function (origin, cb) {
      if (!origin) return cb(null, true); // allow curl/postman
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed from " + origin), false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

/* ----------------------- In-memory sessions ----------------------- */
const sessions = new Map();

/* -------------------------- Helpers ------------------------------- */
function authHeader(email, apiToken) {
  const tokenStr = `${email}/token:${apiToken}`;
  const b64 = Buffer.from(tokenStr).toString("base64");
  return `Basic ${b64}`;
}

function requireSession(req, res) {
  const sid = req.cookies?.zd_sid;
  if (!sid || !sessions.has(sid)) {
    res.status(401).json({ ok: false, error: "Not authenticated" });
    return null;
  }
  return { sid, ...sessions.get(sid) };
}

/* --------------------------- Auth routes -------------------------- */
app.post("/api/login", async (req, res) => {
  try {
    const email = (req.body?.email || process.env.ZENDESK_EMAIL || "").trim();
    const apiToken = (req.body?.token || process.env.ZENDESK_TOKEN || "").trim();
    const subdomain = (req.body?.subdomain || process.env.ZENDESK_SUBDOMAIN || "").trim();

    if (!email || !apiToken || !subdomain) {
      return res.status(400).json({ ok: false, error: "Missing email, token, or subdomain." });
    }

    const base = `https://${subdomain}.zendesk.com`;
    const resp = await axios.get(`${base}/api/v2/users/me.json`, {
      headers: { Authorization: authHeader(email, apiToken) },
    });

    const me = resp.data?.user;
    if (!me) throw new Error("Could not validate user");

    const sid = uuidv4();
    sessions.set(sid, { email, apiToken, subdomain });

    res.cookie("zd_sid", sid, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    });

    return res.json({
      ok: true,
      user: { id: me.id, name: me.name, email: me.email },
      subdomain,
    });
  } catch (err) {
    const status = err?.response?.status || 401;
    const msg = err?.response?.data || err.message || "Authentication failed";
    return res.status(status).json({ ok: false, error: msg });
  }
});

app.get("/api/session", (req, res) => {
  const sess = requireSession(req, res);
  if (!sess) return;
  res.json({ ok: true, email: sess.email, subdomain: sess.subdomain });
});

app.post("/api/logout", (req, res) => {
  const sid = req.cookies?.zd_sid;
  if (sid) sessions.delete(sid);
  res.clearCookie("zd_sid", {
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ ok: true });
});

/* ------------------------ Ticket detail APIs ---------------------- */
app.get("/api/tickets/:id", async (req, res) => {
  const sess = requireSession(req, res);
  if (!sess) return;
  try {
    const base = `https://${sess.subdomain}.zendesk.com`;
    const url = `${base}/api/v2/tickets/${req.params.id}.json?include=users,organizations,groups`;
    const zdResp = await axios.get(url, { headers: { Authorization: authHeader(sess.email, sess.apiToken) } });
    res.json(zdResp.data);
  } catch (err) {
    res.status(err?.response?.status || 500).json({ ok: false, error: err?.response?.data || err.message });
  }
});

app.get("/api/tickets/:id/comments", async (req, res) => {
  const sess = requireSession(req, res);
  if (!sess) return;
  try {
    const base = `https://${sess.subdomain}.zendesk.com`;
    const url = `${base}/api/v2/tickets/${req.params.id}/comments.json?include=users&include_inline_images=true`;
    const zdResp = await axios.get(url, { headers: { Authorization: authHeader(sess.email, sess.apiToken) } });
    res.json(zdResp.data);
  } catch (err) {
    res.status(err?.response?.status || 500).json({ ok: false, error: err?.response?.data || err.message });
  }
});

app.put("/api/tickets/:id", async (req, res) => {
  const sess = requireSession(req, res);
  if (!sess) return;
  try {
    const base = `https://${sess.subdomain}.zendesk.com`;
    const url = `${base}/api/v2/tickets/${req.params.id}.json`;
    const zdResp = await axios.put(url, req.body, {
      headers: {
        Authorization: authHeader(sess.email, sess.apiToken),
        "Content-Type": "application/json",
      },
    });
    res.json(zdResp.data);
  } catch (err) {
    res.status(err?.response?.status || 500).json({ ok: false, error: err?.response?.data || err.message });
  }
});

app.post("/api/tickets/:id/comment", upload.array("files"), async (req, res) => {
  const sess = requireSession(req, res);
  if (!sess) return;
  try {
    const base = `https://${sess.subdomain}.zendesk.com`;
    const { body, html_body, isPublic } = req.body;
    const files = req.files || [];
    const tokens = [];

    for (const f of files) {
      const up = await axios.post(
        `${base}/api/v2/uploads.json?filename=${encodeURIComponent(f.originalname)}`,
        f.buffer,
        {
          headers: {
            Authorization: authHeader(sess.email, sess.apiToken),
            "Content-Type": f.mimetype || "application/octet-stream",
          },
        }
      );
      tokens.push(up.data.upload.token);
    }

    const payload = {
      ticket: {
        comment: {
          ...(html_body ? { html_body } : { body }),
          public: isPublic === "true" || isPublic === true,
          ...(tokens.length ? { uploads: tokens } : {}),
        },
      },
    };

    const zdResp = await axios.put(`${base}/api/v2/tickets/${req.params.id}.json`, payload, {
      headers: {
        Authorization: authHeader(sess.email, sess.apiToken),
        "Content-Type": "application/json",
      },
    });

    res.json(zdResp.data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data;
    console.error("Zendesk comment error:", status, JSON.stringify(data));
    return res.status(status).json({ ok: false, error: data || err.message || "Unknown error" });
  }
});

/* --------------------------- Health check ------------------------- */
app.get("/api/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

/* ---------------------------- Listen ------------------------------ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Zendesk proxy on http://localhost:${PORT}`));
