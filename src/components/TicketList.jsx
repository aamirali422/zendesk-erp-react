// src/components/TicketList.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { zdGet } from "@/lib/zendesk";

const data = await zdGet("/api/v2/tickets.json?per_page=50");
/** Best-effort mapping from submenu category -> type/tags */
const matchesCategory = (ticket, categoryKey) => {
  if (!categoryKey) return true;
  const t = (ticket.type || "").toLowerCase();
  const tags = ticket.tags || [];
  switch (categoryKey) {
    case "tech-help":
      return t === "question" || tags.includes("support") || tags.includes("tech_help");
    case "data-recovery":
      return tags.includes("data_recovery") || tags.includes("recovery");
    case "warranty-claim":
      return tags.includes("warranty") || t === "problem";
    case "general-support":
      return !t || t === "-" || tags.includes("general") || tags.includes("other");
    default:
      return true;
  }
};

function withinPeriod(dateStr, period) {
  const d = new Date(dateStr);
  const now = new Date();
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return d >= start && d <= now;
  }
  if (period === "month") {
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }
  if (period === "year") {
    return d.getFullYear() === now.getFullYear();
  }
  return true;
}

/** Convert Zendesk next_page full URL -> our proxy path (must start with “/api/v2/...”) */
function pathFromNextPage(fullUrl) {
  try {
    const u = new URL(fullUrl);
    const idx = u.pathname.indexOf("/api/v2");
    if (idx >= 0) {
      const full = u.pathname.slice(idx) + (u.search || "");
      return full || "/api/v2/tickets.json";
    }
  // eslint-disable-next-line no-unused-vars
  } catch (_e) {
    return null;
  }
  return null;
}

/** Normalize Zendesk ticket to the fields we display. */
function normalizeTicket(z) {
  return {
    id: z.id,
    subject: z.subject || "(no subject)",
    status: (z.status || "").toLowerCase(),
    type: z.type || null,
    tags: z.tags || [],
    created_at: z.created_at,
    requester_id: z.requester_id,
    assignee_id: z.assignee_id,
    // UI placeholders for now (Zendesk doesn’t have your product/agent naming)
    product: z.product || "—",
    agentLabel: z.assignee_id ? `Agent #${z.assignee_id}` : "Unassigned",
    requesterLabel:
      z.requester?.email ||
      z.requester_email ||
      (z.requester_id ? `Requester #${z.requester_id}` : "Requester"),
  };
}

/** Build the initial path for the selected source — all MUST start with /api/v2 */
function buildInitialPath(source, orgId, userId) {
  switch (source) {
    case "all":
      return "/api/v2/tickets.json?per_page=50";
    case "recent":
      return "/api/v2/tickets/recent.json?per_page=50";
    case "org":
      if (!orgId) return null;
      return `/api/v2/organizations/${encodeURIComponent(orgId)}/tickets.json?per_page=50`;
    case "user-requested":
      if (!userId) return null;
      return `/api/v2/users/${encodeURIComponent(userId)}/tickets/requested.json?per_page=50`;
    case "user-ccd":
      if (!userId) return null;
      return `/api/v2/users/${encodeURIComponent(userId)}/tickets/ccd.json?per_page=50`;
    case "user-followed":
      if (!userId) return null;
      return `/api/v2/users/${encodeURIComponent(userId)}/tickets/followed.json?per_page=50`;
    case "user-assigned":
      if (!userId) return null;
      return `/api/v2/users/${encodeURIComponent(userId)}/tickets/assigned.json?per_page=50`;
    default:
      return "/api/v2/tickets.json?per_page=50";
  }
}

export default function TicketsList({
  onSelectTicket,
  onSelectTicketReadonly,
  category = "",
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Source selector + IDs
  const [source, setSource] = useState("all"); // all | recent | org | user-requested | user-ccd | user-followed | user-assigned
  const [orgId, setOrgId] = useState("");
  const [userId, setUserId] = useState("");

  // Local filters (existing UI)
  const [searchId, setSearchId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");

  // Data states
  const [tickets, setTickets] = useState([]);
  const [nextPagePath, setNextPagePath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Infinite scroll refs
  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Static dropdowns (kept to match your UI theme)
  const allProducts = [
    "CFexpress™ v4 Type A",
    "CFexpress™ 2.0 Type B",
    "SDXC™ UHS-II",
    "microSDXC™ UHS-I",
    "Portable SSD",
    "Card Reader CFast 2.0",
    "Tech Pouch",
  ];
  const allAgents = ["Agent One", "Agent Two"];

  // URL filters from Analytics cards
  const urlPeriod = (searchParams.get("period") || "").toLowerCase(); // week|month|year|''
  const urlStatus = (searchParams.get("status") || "").toLowerCase(); // open|closed|''

  // Category label chip
  const categoryLabel = category
    ? {
        "tech-help": "Tech help",
        "data-recovery": "Data recovery",
        "warranty-claim": "Warranty claim",
        "general-support": "General support",
      }[category]
    : "";

  const clearUrlFilters = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("period");
    next.delete("status");
    setSearchParams(next);
  };

  /** Fetch first page for current source */
  async function fetchFirstPage() {
    setLoading(true);
    setError(null);
    setTickets([]);
    setNextPagePath(null);

    const path = buildInitialPath(source, orgId.trim(), userId.trim());
    if (!path) {
      setLoading(false);
      return; // waiting for required ID
    }

    try {
      const data = await zdGet(path); // calls /api/zendesk?path=...
      const list = (data.tickets || []).map(normalizeTicket);
      setTickets(list);
      setNextPagePath(pathFromNextPage(data.next_page || ""));
    } catch (err) {
      // Bubble a friendly message
      const msg =
        err?.message ||
        (typeof err === "string" ? err : null) ||
        "Failed to fetch tickets from Zendesk.";
      setError(msg);
      console.error("Zendesk fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }

  /** Load more when sentinel is visible */
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        if (!nextPagePath || loadingMore) return;

        try {
          setLoadingMore(true);
          const more = await zdGet(nextPagePath);
          const list = (more.tickets || []).map(normalizeTicket);
          setTickets((prev) => [...prev, ...list]);
          setNextPagePath(pathFromNextPage(more.next_page || ""));
        } catch (err) {
          console.error("Load more failed:", err);
          setNextPagePath(null);
        } finally {
          setLoadingMore(false);
        }
      },
      { root: containerRef.current, threshold: 1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [nextPagePath, loadingMore]);

  /** Refetch when source/orgId/userId changes */
  useEffect(() => {
    fetchFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, orgId, userId]);

  /** Client-side filters */
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchId = searchId ? String(t.id).includes(searchId) : true;

      // placeholders for theme parity
      const matchProduct = selectedProduct ? t.product === selectedProduct : true;
      const matchAgent = selectedAgent ? t.agentLabel === selectedAgent : true;

      const matchPeriod = urlPeriod ? withinPeriod(t.created_at, urlPeriod) : true;
      const matchStatus = urlStatus ? (t.status || "").toLowerCase() === urlStatus : true;
      const matchCategory = matchesCategory(t, category);

      return matchId && matchProduct && matchAgent && matchPeriod && matchStatus && matchCategory;
    });
  }, [tickets, searchId, selectedProduct, selectedAgent, urlPeriod, urlStatus, category]);

  if (loading) {
    return <div className="p-6 text-gray-500">Loading tickets…</div>;
  }

  return (
    <div className="flex flex-col h-full p-6 bg-gray-50">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold mb-4">Zendesk Tickets</h3>
          {categoryLabel && (
            <span className="mb-4 inline-flex items-center rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
              {categoryLabel}
            </span>
          )}
        </div>
        {(urlPeriod || urlStatus) && (
          <button
            onClick={clearUrlFilters}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm hover:bg-gray-50"
          >
            Clear URL filters
          </button>
        )}
      </div>

      {/* Source selector */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border px-3 py-2 rounded-lg w-64 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="all">All tickets</option>
            <option value="recent">Recent</option>
            <option value="org">By Organization</option>
            <option value="user-requested">User: Requested</option>
            <option value="user-ccd">User: CC’d</option>
            <option value="user-followed">User: Followed</option>
            <option value="user-assigned">User: Assigned</option>
          </select>
        </div>

        {source === "org" && (
          <input
            type="number"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="Organization ID"
            className="border px-3 py-2 rounded-lg w-56 focus:ring-2 focus:ring-indigo-200"
          />
        )}

        {["user-requested", "user-ccd", "user-followed", "user-assigned"].includes(source) && (
          <input
            type="number"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            className="border px-3 py-2 rounded-lg w-56 focus:ring-2 focus:ring-indigo-200"
          />
        )}

        {/* Local filters */}
        <input
          type="text"
          placeholder="Search Ticket ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="border px-3 py-2 rounded-lg w-48 focus:ring-2 focus:ring-indigo-200"
        />
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="border px-3 py-2 rounded-lg w-64 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All Products</option>
          {allProducts.map((product) => (
            <option key={product} value={product}>
              {product}
            </option>
          ))}
        </select>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="border px-3 py-2 rounded-lg w-48 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All Agents</option>
          {allAgents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200">
          {error}
        </div>
      )}

      {/* List */}
      <div ref={containerRef} className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
        {filteredTickets.length > 0 ? (
          <>
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
              >
                <div
                  onClick={() => onSelectTicket && onSelectTicket(t)}
                  className="flex flex-col cursor-pointer"
                >
                  <span className="font-semibold">#{t.id} - {t.subject}</span>
                  <span className="text-gray-500 text-sm">{t.type || "—"}</span>
                  <span className="text-gray-500 text-sm">
                    {t.requesterLabel} | Agent: {t.agentLabel} | Product: {t.product}
                  </span>
                  <span className="text-gray-500 text-xs">
                    Status: <strong>{(t.status || "").toUpperCase()}</strong> · Created:{" "}
                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Communicate (editable) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTicket && onSelectTicket(t);
                    }}
                    className="rounded-lg bg-black px-3 py-1.5 text-white text-sm hover:bg-gray-800"
                  >
                    View
                  </button>

                  {/* Optional read-only open (if you wired it in Dashboard) */}
                  {onSelectTicketReadonly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicketReadonly(t);
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Read-only
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Infinite loader row */}
            <div ref={loadMoreRef} className="p-4 text-center text-gray-500">
              {loadingMore
                ? "Loading more…"
                : nextPagePath
                ? "Scroll to load more…"
                : "All tickets loaded."}
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            {source === "org" && !orgId
              ? "Enter an Organization ID to fetch tickets."
              : ["user-requested", "user-ccd", "user-followed", "user-assigned"].includes(source) && !userId
              ? "Enter a User ID to fetch tickets."
              : "No tickets found."}
          </div>
        )}
      </div>
    </div>
  );
}
