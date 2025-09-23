// api/_utils/zd.js
const BASE = s => `https://${s}.zendesk.com/api/v2`;

export function sessionFromReq(req) {
  const header = req.headers.cookie || "";
  const match = header.split(";").find(p => p.trim().startsWith("zd_session="));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.split("=")[1]);
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function authHeader(email, token) {
  const user = `${email}/token:${token}`;
  const b64 = Buffer.from(user).toString("base64");
  return `Basic ${b64}`;
}

export async function zdGetJSON({ subdomain, email, token }, path) {
  if (!path.startsWith("/api/v2")) throw new Error("path must start with /api/v2");
  const url = `${BASE(subdomain)}${path.replace(/^\/api\/v2/, "")}`.replace(/\/$/, "");
  const res = await fetch(url, {
    headers: {
      "Authorization": authHeader(email, token),
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export async function zdPutJSON({ subdomain, email, token }, path, body) {
  if (!path.startsWith("/api/v2")) throw new Error("path must start with /api/v2");
  const url = `${BASE(subdomain)}${path.replace(/^\/api\/v2/, "")}`.replace(/\/$/, "");
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": authHeader(email, token),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export async function zdUploadFile({ subdomain, email, token }, filename, buffer) {
  const url = `https://${subdomain}.zendesk.com/api/v2/uploads.json?filename=${encodeURIComponent(filename)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": authHeader(email, token),
      "Content-Type": "application/binary"
    },
    body: buffer
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  const data = await res.json();
  return data?.upload?.token;
}
