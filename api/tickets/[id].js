// api/tickets/[id].js
import { requireSession, zdFetch } from "../../src/server-lib/zd.js";

export default async function handler(req, res) {
  let id = req.url.split("/api/tickets/")[1] || "";
  id = id.split("?")[0];

  try {
    const session = requireSession(req);

    if (req.method === "GET") {
      // include sideloads: users, organizations
      const data = await zdFetch(session, `/api/v2/tickets/${id}.json?include=users,organizations`);
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(data));
    }

    if (req.method === "PUT") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = Buffer.concat(chunks).toString("utf8") || "{}";
      const payload = JSON.parse(body);

      const data = await zdFetch(session, `/api/v2/tickets/${id}.json`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(data));
    }

    res.statusCode = 405;
    res.end("Method Not Allowed");
  } catch (err) {
    res.statusCode = err.status || 500;
    res.end(JSON.stringify({ error: err.message || "Ticket error" }));
  }
}
