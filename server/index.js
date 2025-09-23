// server/index.js
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const upload = multer(); // memory storage
const PORT = process.env.PORT || 4000;

// --- Basic dev CORS (works even if you bypass the Vite proxy) ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// --- In-memory "session store" for dev ---
/**
 * sessions: Map<sessionId, { email, token, subdomain, user }>
 */
const sessions = new Map();

// --- Helpers -----------------------------------------------------
function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Create an axios client for Zendesk using current session
 */
function makeZendeskClient({ email, token, subdomain }) {
  const baseURL = `https://${subdomain}.zendesk.com/api/v2`;
  // Zendesk API uses Basic auth with user `${email}/token` and password `token`
  const authUser = `${email}/token`;
  const authPass = token;

  const instance = axios.create({
    baseURL,
    auth: { username: authUser, password: authPass },
    // Zendesk prefers JSON everywhere except uploads
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
    validateStatus: () => true, // we'll handle errors ourselves
  });

  return instance;
}

/**
 * Attach session to req if cookie present
 */
function sessionMiddleware(req, _res, next) {
  const sid = req.cookies?.session;
  if (sid && sessions.has(sid)) {
    req.sessionData = sessions.get(sid);
  }
  next();
}
app.use(sessionMiddleware);

/**
 * Guard for endpoints that need a session
 */
function requireSession(req, res, next) {
  if (!req.sessionData) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

/**
 * Normalize axios/Zendesk error to readable JSON
 */
function zendeskError(res, axRes) {
  const status = axRes?.status || 500;
  const data = axRes?.data;
  return res.status(status).json({
    error: data?.error || data?.description || data?.message || `Zendesk HTTP ${status}`,
    details: data || null,
  });
}

// --- Routes ------------------------------------------------------

// Basic healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

/**
 * POST /api/login
 * body: { email, token, subdomain }
 * Verifies credentials via /users/me.json, then sets a session cookie
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, token, subdomain } = req.body || {};
    if (!email || !token || !subdomain) {
      return res.status(400).json({ error: 'email, token, and subdomain are required' });
    }

    const client = makeZendeskClient({ email, token, subdomain });
    const me = await client.get('/users/me.json');

    if (me.status !== 200 || !me.data?.user) {
      return zendeskError(res, me);
    }

    const sid = uuidv4();
    const sessionValue = {
      email,
      token,
      subdomain,
      user: me.data.user,
    };
    sessions.set(sid, sessionValue);

    // Dev-friendly cookie flags
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('session', sid, {
      httpOnly: true,
      secure: isProd,              // false in dev (http://localhost)
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });

    return res.json({ ok: true, user: me.data.user, subdomain });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/session
 * Returns current session info (user, subdomain)
 */
app.get('/api/session', requireSession, (req, res) => {
  const { user, subdomain, email } = req.sessionData;
  res.json({ ok: true, user, subdomain, email });
});

/**
 * POST /api/logout
 * Clears the cookie and removes the in-memory session
 */
app.post('/api/logout', (req, res) => {
  const sid = req.cookies?.session;
  if (sid) sessions.delete(sid);

  res.clearCookie('session', { path: '/' });
  res.json({ ok: true });
});

/**
 * GET /api/zendesk?path=/api/v2/...
 * Generic GET proxy for Zendesk "list" endpoints used by UI
 * Requires query param 'path' that MUST start with /api/v2
 */
app.get('/api/zendesk', requireSession, async (req, res) => {
  try {
    const path = String(req.query.path || '');
    if (!path.startsWith('/api/v2')) {
      return res.status(400).json({ error: 'Invalid path: must start with /api/v2' });
    }
    const client = makeZendeskClient(req.sessionData);
    const zr = await client.get(path.replace('/api/v2', '')); // because client already has baseURL /api/v2

    if (zr.status >= 200 && zr.status < 300) {
      return res.status(zr.status).json(zr.data);
    }
    return zendeskError(res, zr);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy failed' });
  }
});

/**
 * GET /api/tickets/:id
 * Includes users & organizations to match your UI
 */
app.get('/api/tickets/:id', requireSession, async (req, res) => {
  const { id } = req.params;
  try {
    const client = makeZendeskClient(req.sessionData);
    const zr = await client.get(`/tickets/${encodeURIComponent(id)}.json?include=users,organizations`);
    if (zr.status >= 200 && zr.status < 300) {
      return res.json(zr.data);
    }
    return zendeskError(res, zr);
  } catch (err) {
    console.error('Get ticket error:', err);
    return res.status(500).json({ error: 'Get ticket failed' });
  }
});

/**
 * GET /api/tickets/:id/comments
 * With users sideload
 */
app.get('/api/tickets/:id/comments', requireSession, async (req, res) => {
  const { id } = req.params;
  try {
    const client = makeZendeskClient(req.sessionData);
    const zr = await client.get(`/tickets/${encodeURIComponent(id)}/comments.json?include=users`);
    if (zr.status >= 200 && zr.status < 300) {
      return res.json(zr.data);
    }
    return zendeskError(res, zr);
  } catch (err) {
    console.error('List comments error:', err);
    return res.status(500).json({ error: 'List comments failed' });
  }
});

/**
 * PUT /api/tickets/:id
 * body: { ticket: { requester_id, assignee_id, type, priority, status, tags } }
 */
app.put('/api/tickets/:id', requireSession, async (req, res) => {
  const { id } = req.params;
  const { ticket } = req.body || {};
  if (!ticket || typeof ticket !== 'object') {
    return res.status(400).json({ error: 'Missing ticket payload' });
  }
  try {
    const client = makeZendeskClient(req.sessionData);
    const zr = await client.put(`/tickets/${encodeURIComponent(id)}.json`, { ticket });
    if (zr.status >= 200 && zr.status < 300) {
      return res.json(zr.data);
    }
    return zendeskError(res, zr);
  } catch (err) {
    console.error('Update ticket error:', err);
    return res.status(500).json({ error: 'Update ticket failed' });
  }
});

/**
 * POST /api/tickets/:id/comment
 * form-data: body, html_body (optional), isPublic (string "true"/"false"), files[]
 * - Uploads each file to Zendesk uploads API -> collects tokens
 * - Adds a ticket comment with `uploads: [tokens...]`
 */
app.post('/api/tickets/:id/comment', requireSession, upload.any(), async (req, res) => {
  const { id } = req.params;
  const isPublic = String(req.body?.isPublic || 'true') === 'true';
  const body = req.body?.body || req.body?.html_body || 'Attachment(s) uploaded.'; // never empty

  try {
    const client = makeZendeskClient(req.sessionData);

    // 1) Upload files (if any)
    let uploadTokens = [];
    const files = (req.files || []);
    for (const f of files) {
      // Zendesk uploads API:
      // POST /api/v2/uploads.json?filename=<name>
      // Content-Type: application/binary
      const resp = await axios({
        method: 'post',
        url: `https://${req.sessionData.subdomain}.zendesk.com/api/v2/uploads.json?filename=${encodeURIComponent(f.originalname)}`,
        data: f.buffer,
        auth: {
          username: `${req.sessionData.email}/token`,
          password: req.sessionData.token,
        },
        headers: {
          'Content-Type': 'application/binary',
        },
        timeout: 60000,
        validateStatus: () => true,
      });

      if (resp.status >= 200 && resp.status < 300 && resp.data?.upload?.token) {
        uploadTokens.push(resp.data.upload.token);
      } else {
        console.error('Upload failed:', resp.status, resp.data);
        return zendeskError(res, resp);
      }
    }

    // 2) Add comment with uploads
    // PUT /tickets/:id.json { ticket: { comment: { body, public, uploads: [...] } } }
    const payload = {
      ticket: {
        comment: {
          body,
          public: isPublic,
          ...(uploadTokens.length ? { uploads: uploadTokens } : {}),
        },
      },
    };

    const zr = await client.put(`/tickets/${encodeURIComponent(id)}.json`, payload);

    if (zr.status >= 200 && zr.status < 300) {
      return res.json(zr.data);
    }
    return zendeskError(res, zr);
  } catch (err) {
    console.error('Post comment error:', err);
    return res.status(500).json({ error: 'Post comment failed' });
  }
});

// --- Start server ------------------------------------------------
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
