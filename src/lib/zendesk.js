// src/lib/zendesk.js

export async function zdGet(path) {
  const resp = await fetch(`/api/zendesk?path=${encodeURIComponent(path)}`, {
    credentials: "include",
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || "Zendesk GET failed");
  return data;
}

export async function zdPost(path, body) {
  const resp = await fetch(`/api/zendesk?path=${encodeURIComponent(path)}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || "Zendesk POST failed");
  return data;
}
