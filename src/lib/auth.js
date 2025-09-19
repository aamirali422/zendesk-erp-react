// src/lib/auth.js
import { apiUrl, ensureOk } from "./apiBase";

export async function login({ email, token, subdomain }) {
  const res = await fetch(apiUrl("/login"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token, subdomain }),
  });
  await ensureOk(res);
  return res.json();
}

export async function getSession() {
  const res = await fetch(apiUrl("/session"), { credentials: "include" });
  await ensureOk(res);
  return res.json();
}

export async function logout() {
  const res = await fetch(apiUrl("/logout"), {
    method: "POST",
    credentials: "include",
  });
  await ensureOk(res);
  return res.json();
}
