// api/_session.js
export const config = { runtime: "nodejs20.x" };

import { createHash } from "node:crypto";

const COOKIE_NAME = "zd_sid";

// tiny in-memory session store (serverless note: per instance)
const sessions = new Map();

export function authHeader(email, apiToken) {
  const b64 = Buffer.from(`${email}/token:${apiToken}`).toString("base64");
  return `Basic ${b64}`;
}

export function setSessionCookie(req, res, { email, apiToken, subdomain }) {
  // stable-ish id for demo; you can swap to uuid
  const sid = createHash("sha256")
    .update(`${email}:${subdomain}:${Date.now()}:${Math.random()}`)
    .digest("hex");

  sessions.set(sid, { email, apiToken, subdomain });

  res.setHeader("Set-Cookie", [
    `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure; " : ""
    }Max-Age=28800`,
  ]);
}

export function readSession(req, res) {
  const cookie = req.headers.cookie || "";
  const sid = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!sid || !sessions.has(sid)) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Not authenticated" }));
    return null;
  }
  return { sid, ...sessions.get(sid) };
}

export function clearSession(req, res) {
  const cookie = req.headers.cookie || "";
  const sid = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (sid) sessions.delete(sid);

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; ${
      process.env.NODE_ENV === "production" ? "Secure; " : ""
    }Max-Age=0`
  );
}
