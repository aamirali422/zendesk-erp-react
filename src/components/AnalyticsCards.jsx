/* eslint-disable no-unused-vars */
// src/components/AnalyticsCards.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zdGet } from "@/lib/zendesk";

const OPEN_STATES = new Set(["new", "open", "pending", "hold"]);
const CLOSED_STATES = new Set(["solved", "closed"]);

function withinPeriod(dateStr, period) {
  const d = new Date(dateStr);
  const now = new Date();
  if (Number.isNaN(d.getTime())) return false;

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

export default function AnalyticsCards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const currentPeriod = (searchParams.get("period") || "").toLowerCase();
  const currentStatus = (searchParams.get("status") || "").toLowerCase();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // 1) Try ALL tickets (matches your list’s default)
        let data = await zdGet("/api/v2/tickets.json?per_page=100");
        let list = Array.isArray(data?.tickets) ? data.tickets : [];

        // 2) If empty, fall back to RECENT (some accounts restrict all-tickets)
        if (!list.length) {
          const data2 = await zdGet("/api/v2/tickets/recent.json?per_page=100");
          list = Array.isArray(data2?.tickets) ? data2.tickets : [];
        }

        if (!alive) return;
        setTickets(list);
      } catch (e) {
        if (!alive) return;
        setErr("Analytics: could not fetch tickets.");
        setTickets([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const counts = useMemo(() => {
    if (!tickets.length) return { year: 0, month: 0, week: 0, open: 0, closed: 0 };

    let year = 0, month = 0, week = 0, open = 0, closed = 0;

    for (const t of tickets) {
      const status = String(t.status || "").toLowerCase();
      const created = t.created_at;

      if (withinPeriod(created, "year")) year++;
      if (withinPeriod(created, "month")) month++;
      if (withinPeriod(created, "week")) week++;

      if (OPEN_STATES.has(status)) open++;
      if (CLOSED_STATES.has(status)) closed++;
    }
    return { year, month, week, open, closed };
  }, [tickets]);

  const goWith = (opts) => {
    const next = new URLSearchParams(searchParams.toString());

    if (opts.period !== undefined) {
      const isActive = (next.get("period") || "").toLowerCase() === opts.period;
      if (isActive) next.delete("period");
      else next.set("period", opts.period);
    }
    if (opts.status !== undefined) {
      const isActive = (next.get("status") || "").toLowerCase() === opts.status;
      if (isActive) next.delete("status");
      else next.set("status", opts.status);
    }

    next.set("view", "tickets");
    navigate({ pathname: "/dashboard", search: `?${next.toString()}` });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    next.set("view", "tickets");
    navigate({ pathname: "/dashboard", search: `?${next.toString()}` });
  };

  const Card = ({ label, value, active, onClick, dim }) => (
    <button
      onClick={onClick}
      disabled={dim}
      className={`min-h-[84px] text-left flex flex-col items-start justify-center rounded-2xl border px-4 py-3 transition
        ${active ? "bg-black text-white border-black shadow-md" : "bg-white text-gray-800 border-gray-200 hover:shadow-md"}
        ${dim ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span className={`text-xs sm:text-sm ${active ? "text-white/90" : "text-gray-500"}`}>{label}</span>
      <span className="text-xl sm:text-2xl font-semibold">{value}</span>
    </button>
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Analytics</h3>
        {(currentPeriod || currentStatus) && (
          <button
            onClick={clearFilters}
            className="text-sm rounded-lg border border-gray-200 px-3 py-1.5 bg-white hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {err && (
        <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-amber-50 text-amber-700 border border-amber-200">
          {err}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card label="This Year"   value={loading ? "…" : counts.year}   active={currentPeriod === "year"}  onClick={() => goWith({ period: "year" })}  dim={loading} />
        <Card label="This Month"  value={loading ? "…" : counts.month}  active={currentPeriod === "month"} onClick={() => goWith({ period: "month" })} dim={loading} />
        <Card label="This Week"   value={loading ? "…" : counts.week}   active={currentPeriod === "week"}  onClick={() => goWith({ period: "week" })}  dim={loading} />
        <Card label="Open Tickets"   value={loading ? "…" : counts.open}   active={currentStatus === "open"}   onClick={() => goWith({ status: "open" })}   dim={loading} />
        <Card label="Closed Tickets" value={loading ? "…" : counts.closed} active={currentStatus === "closed"} onClick={() => goWith({ status: "closed" })} dim={loading} />
      </div>

      {/* tiny helper so you know what we counted */}
      <p className="mt-2 text-xs text-gray-500">
        {loading ? "Loading…" : `Counting ${tickets.length} ticket(s).`}
      </p>
    </div>
  );
}
