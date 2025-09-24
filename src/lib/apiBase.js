// src/lib/apiBase.js
export function apiUrl(path) {
  if (!path.startsWith("/")) return `/api${path}`;
  return path.startsWith("/api") ? path : `/api${path}`;
}

export async function ensureJson(res) {
  // If not OK, try to extract an error body (json → text → status)
  if (!res.ok) {
    try {
      const data = await res.clone().json();
      const detail = data?.error || data?.message || JSON.stringify(data);
      throw new Error(detail || `HTTP ${res.status}`);
    } catch {
      try {
        const txt = await res.clone().text();
        throw new Error(txt || `HTTP ${res.status}`);
      } catch {
        throw new Error(`HTTP ${res.status}`);
      }
    }
  }

  // If OK but body isn’t JSON (e.g. HTML), downgrade cleanly
  try {
    return await res.json();
  } catch {
    const text = await res.text();
    throw new Error(`Expected JSON but got: ${text.slice(0, 200)}…`);
  }
}
