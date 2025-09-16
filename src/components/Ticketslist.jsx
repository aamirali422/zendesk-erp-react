// src/components/TicketsList.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// Map submenu categories to a field you already have.
// Here I’m matching your dummy "reason" field.
const CATEGORY_TO_REASON = {
  "tech-help": "Support",
  "data-recovery": "Complaint",     // tweak as you like
  "warranty-claim": "Inquiry",      // tweak as you like
  "general-support": "Other",       // tweak as you like
};

// Dummy tickets generator (with status + createdAt + reason)
const generateTickets = () => {
  const tickets = [];
  const subjects = ["Login Issue","Payment Failed","Bug Report","Feature Request","Account Locked"];
  const reasons = ["Support","Complaint","Feedback","Inquiry","Other"];
  const agents = ["Agent One","Agent Two"];
  const requesters = ["john@example.com","sara@example.com","mike@example.com","lisa@example.com","tom@example.com"];
  const products = [
    "CFexpress™ v4 Type A","CFexpress™ 2.0 Type B","SDXC™ UHS-II","microSDXC™ UHS-I",
    "Portable SSD","Card Reader CFast 2.0","Tech Pouch"
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
};

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

export default function TicketsList({ onSelectTicket, category = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const allTickets = useRef(generateTickets());
  const [searchId, setSearchId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  const containerRef = useRef();

  const allProducts = [
    "CFexpress™ v4 Type A","CFexpress™ 2.0 Type B","SDXC™ UHS-II","microSDXC™ UHS-I",
    "Portable SSD","Card Reader CFast 2.0","Tech Pouch"
  ];
  const allAgents = ["Agent One","Agent Two"];

  // URL filters (from Analytics)
  const urlPeriod = (searchParams.get("period") || "").toLowerCase(); // week|month|year|''
  const urlStatus = (searchParams.get("status") || "").toLowerCase(); // open|closed|''

  const categoryReason = CATEGORY_TO_REASON[category] || ""; // derived submenu filter

  const filteredTickets = useMemo(() => {
    return allTickets.current.filter((t) => {
      const matchId = searchId ? t.id.toString().includes(searchId) : true;
      const matchProduct = selectedProduct ? t.product === selectedProduct : true;
      const matchAgent = selectedAgent ? t.agent === selectedAgent : true;
      const matchPeriod = urlPeriod ? withinPeriod(t.createdAt, urlPeriod) : true;
      const matchStatus = urlStatus ? t.status.toLowerCase() === urlStatus : true;
      const matchCategory = categoryReason ? t.reason === categoryReason : true;
      return matchId && matchProduct && matchAgent && matchPeriod && matchStatus && matchCategory;
    });
  }, [searchId, selectedProduct, selectedAgent, urlPeriod, urlStatus, categoryReason]);

  const visibleTickets = useMemo(
    () => filteredTickets.slice(0, visibleCount),
    [filteredTickets, visibleCount]
  );

  // Infinite scroll
  const loadMoreRef = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleCount < filteredTickets.length) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { root: containerRef.current, threshold: 1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleTickets, filteredTickets.length, visibleCount]);

  // Remove ticket (demo)
  const handleRemove = (id) => {
    allTickets.current = allTickets.current.filter((t) => t.id !== id);
    if (visibleCount > 0) setVisibleCount((prev) => Math.max(0, prev - 1));
  };

  const clearUrlFilters = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("period");
    next.delete("status");
    setSearchParams(next);
  };

  const categoryLabel = category
    ? {
        "tech-help": "Tech help",
        "data-recovery": "Data recovery",
        "warranty-claim": "Warranty claim",
        "general-support": "General support",
      }[category]
    : "";

  return (
    <div className="flex flex-col h-full p-6 bg-gray-50">
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4 items-end">
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
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="border px-3 py-2 rounded-lg w-48 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All Agents</option>
          {allAgents.map((agent) => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>

        {(urlPeriod || urlStatus) && (
          <div className="ml-auto text-sm text-gray-600">
            {urlPeriod && <span className="mr-2">Period: <strong>{urlPeriod}</strong></span>}
            {urlStatus && <span>Status: <strong>{urlStatus}</strong></span>}
          </div>
        )}
      </div>

      {/* List */}
      <div ref={containerRef} className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
        {visibleTickets.map((t) => (
          <div
            key={t.id}
            className="flex justify-between items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
          >
            <div onClick={() => onSelectTicket(t)} className="flex flex-col">
              <span className="font-semibold">
                #{t.id} - {t.subject}
              </span>
              <span className="text-gray-500 text-sm">{t.reason}</span>
              <span className="text-gray-500 text-sm">
                {t.requester} | Agent: {t.agent} | Product: {t.product}
              </span>
              <span className="text-gray-500 text-xs">
                Status: <strong>{t.status}</strong> · Created: {t.createdAt.toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => handleRemove(t.id)}
              className="ml-4 rounded-lg bg-black px-3 py-1.5 text-white text-sm hover:bg-gray-800"
            >
              View
            </button>
          </div>
        ))}

        <div ref={loadMoreRef} className="p-4 text-center text-gray-500">
          {visibleTickets.length < filteredTickets.length
            ? "Scroll to load more..."
            : visibleTickets.length === 0
            ? "No tickets found."
            : "All tickets loaded."}
        </div>
      </div>
    </div>
  );
}
