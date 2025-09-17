// src/components/BackupRestore.jsx
import { useState } from "react";

/** Demo DB payload — replace with real API later if needed */
function generateDbTickets() {
  const rows = [
    { id: 1001, subject: "Payment Failed", reason: "Complaint", requester: "sara@example.com", agent: "Agent Two", product: "CFexpress™ 2.0 Type B", status: "Open",   createdAt: "2024-11-24" },
    { id: 1002, subject: "Bug Report",      reason: "Feedback",  requester: "mike@example.com", agent: "Agent One",  product: "SDXC™ UHS-II",            status: "Closed", createdAt: "2024-11-13" },
    { id: 1003, subject: "Feature Request", reason: "Inquiry",    requester: "lisa@example.com", agent: "Agent Two",  product: "microSDXC™ UHS-I",        status: "Open",   createdAt: "2025-07-22" },
    { id: 1004, subject: "Account Locked",  reason: "Other",      requester: "tom@example.com",  agent: "Agent One",  product: "Portable SSD",            status: "Closed", createdAt: "2025-08-10" },
    { id: 1005, subject: "Login Issue",     reason: "Support",    requester: "john@example.com", agent: "Agent Two",  product: "Card Reader CFast 2.0",   status: "Open",   createdAt: "2024-11-20" },
    { id: 1006, subject: "Payment Failed",  reason: "Complaint",  requester: "sara@example.com", agent: "Agent One",  product: "Tech Pouch",              status: "Closed", createdAt: "2025-01-05" },
    { id: 1007, subject: "Bug Report",      reason: "Feedback",   requester: "mike@example.com", agent: "Agent Two",  product: "CFexpress™ v4 Type A",    status: "Open",   createdAt: "2025-06-27" },
    { id: 1008, subject: "Feature Request", reason: "Inquiry",    requester: "lisa@example.com", agent: "Agent One",  product: "CFexpress™ 2.0 Type B",   status: "Closed", createdAt: "2025-04-01" },
    { id: 1009, subject: "Account Locked",  reason: "Other",      requester: "tom@example.com",  agent: "Agent Two",  product: "SDXC™ UHS-II",            status: "Open",   createdAt: "2024-10-20" },
    { id: 1010, subject: "Login Issue",     reason: "Support",    requester: "john@example.com", agent: "Agent One",  product: "microSDXC™ UHS-I",        status: "Closed", createdAt: "2025-04-28" },
  ];
  return rows.map((r) => ({ ...r, createdAt: new Date(r.createdAt) }));
}

export default function BackupRestore({ mode = "", onView }) {
  const [tickets, setTickets] = useState([]);
  const [banner, setBanner] = useState(null); // {type: 'success'|'info'|'error', text: string}

  const handleGetBackupFromZendesk = () => {
    // simulate a fetch-only action (no list)
    setBanner({ type: "success", text: "Backup fetched from Zendesk successfully (demo)." });
  };

  const handleRestoreFromDb = () => {
    // load demo tickets into the list
    setTickets(generateDbTickets());
    setBanner({ type: "success", text: "Restored from DB successfully. Showing tickets below." });
  };

  const handleClear = () => {
    setTickets([]);
    setBanner(null);
  };

  return (
    <div className="flex h-full flex-col p-6 bg-gray-50">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Backup &amp; Restore</h3>
          {mode && <p className="text-sm text-gray-500 mt-0.5 capitalize">{mode}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGetBackupFromZendesk}
            className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Get backup from Zendesk
          </button>
          <button
            onClick={handleRestoreFromDb}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
          >
            Restore backup from DB
          </button>
          {tickets.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            banner.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : banner.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {banner.text}
        </div>
      )}

      {/* Ticket list (same look & feel as TicketsList rows) */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg bg-white">
        {tickets.length > 0 ? (
          tickets.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="flex flex-col">
                <span className="font-semibold">#{t.id} - {t.subject}</span>
                <span className="text-gray-500 text-sm">{t.reason}</span>
                <span className="text-gray-500 text-sm">
                  {t.requester} | Agent: {t.agent} | Product: {t.product}
                </span>
                <span className="text-gray-500 text-xs">
                  Status: <strong>{t.status}</strong> · Created: {t.createdAt.toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => onView && onView(t)}   // ← opens ReadonlyTicketDetail via Dashboard
                className="ml-4 rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                View
              </button>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            Use <span className="font-medium">Restore backup from DB</span> to load tickets here,
            or <span className="font-medium">Get backup from Zendesk</span> to simulate a fetch.
          </div>
        )}
      </div>
    </div>
  );
}
