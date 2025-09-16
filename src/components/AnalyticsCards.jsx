import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Lightweight ticket generator so cards can compute counts.
 * (Matches TicketsList's generator so numbers align.)
 */
function generateTickets() {
  const tickets = [];
  const subjects = ["Login Issue", "Payment Failed", "Bug Report", "Feature Request", "Account Locked"];
  const reasons = ["Support", "Complaint", "Feedback", "Inquiry", "Other"];
  const agents = ["Agent One", "Agent Two"];
  const requesters = ["john@example.com", "sara@example.com", "mike@example.com", "lisa@example.com", "tom@example.com"];
  const products = [
    "CFexpress™ v4 Type A",
    "CFexpress™ 2.0 Type B",
    "SDXC™ UHS-II",
    "microSDXC™ UHS-I",
    "Portable SSD",
    "Card Reader CFast 2.0",
    "Tech Pouch",
  ];

  const now = new Date();
  for (let i = 1; i <= 40; i++) {
    const daysAgo = Math.floor(Math.random() * 365);
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - daysAgo);

    const status = i % 2 === 0 ? "Closed" : "Open";

    tickets.push({
      id: 1000 + i,
      subject: subjects[i % subjects.length],
      reason: reasons[i % reasons.length],
      requester: requesters[i % requesters.length],
      agent: agents[i % agents.length],
      product: products[i % products.length],
      status,
      createdAt,
    });
  }
  return tickets;
}

function withinPeriod(date, period) {
  const d = new Date(date);
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

export default function AnalyticsCards() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // active filters from URL
  const currentPeriod = (searchParams.get("period") || "").toLowerCase(); // '', 'year', 'month', 'week'
  const currentStatus = (searchParams.get("status") || "").toLowerCase(); // '', 'open', 'closed'

  // counts
  const tickets = useMemo(() => generateTickets(), []);
  const counts = useMemo(() => {
    const year = tickets.filter(t => withinPeriod(t.createdAt, "year")).length;
    const month = tickets.filter(t => withinPeriod(t.createdAt, "month")).length;
    const week = tickets.filter(t => withinPeriod(t.createdAt, "week")).length;
    const open = tickets.filter(t => t.status === "Open").length;
    const closed = tickets.filter(t => t.status === "Closed").length;
    return { year, month, week, open, closed };
  }, [tickets]);

  // set/toggle filters in URL and go to tickets
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

  // single definition of Card (avoid duplicates)
  const Card = ({ label, value, active, onClick }) => (
    <button
      onClick={onClick}
      className={`min-h-[84px] text-left flex flex-col items-start justify-center rounded-2xl border px-4 py-3 transition
        ${active ? "bg-black text-white border-black shadow-md" : "bg-white text-gray-800 border-gray-200 hover:shadow-md"}`}
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

      {/* Responsive grid: 2 cols on phones, 3 on small screens, 5 on md+ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card label="This Year" value={counts.year} active={currentPeriod === "year"} onClick={() => goWith({ period: "year" })} />
        <Card label="This Month" value={counts.month} active={currentPeriod === "month"} onClick={() => goWith({ period: "month" })} />
        <Card label="This Week" value={counts.week} active={currentPeriod === "week"} onClick={() => goWith({ period: "week" })} />
        <Card label="Open Tickets" value={counts.open} active={currentStatus === "open"} onClick={() => goWith({ status: "open" })} />
        <Card label="Closed Tickets" value={counts.closed} active={currentStatus === "closed"} onClick={() => goWith({ status: "closed" })} />
      </div>
    </div>
  );
}
