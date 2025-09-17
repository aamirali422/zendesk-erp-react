// src/components/ReadonlyTicketDetail.jsx
import ERPPanel from "./ERPPanel";

export default function ReadonlyTicketDetail({ ticket, onBack, onView }) {
  if (!ticket) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No ticket selected.
      </div>
    );
  }

  const handleView = () => {
    // Prefer a caller-provided handler
    if (onView) return onView(ticket);

    // Fallback: open external URL if present (e.g., Zendesk ticket URL)
    if (ticket.externalUrl) {
      window.open(ticket.externalUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* LEFT */}
      <section className="md:col-span-2 space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                ← Back
              </button>
              <h3 className="text-lg font-semibold">
                Ticket #{ticket.id} — {ticket.subject}
              </h3>
            </div>

            {/* NEW: View button */}
            <button
              onClick={handleView}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              View
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Requester</label>
              <p className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                {ticket.requester}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assignee</label>
              <p className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                {ticket.agent}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {ticket.tags?.length ? (
                  ticket.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs"
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <p className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                {ticket.type || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Priority</label>
              <p className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 text-sm">
                {ticket.priority}
              </p>
            </div>
          </div>
        </div>

        {/* Conversation Card */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="p-4 space-y-3">
            {ticket.messages?.length ? (
              ticket.messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    m.from === "Agent" ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{m.from}</p>
                    <p className="text-xs text-gray-500">{m.time}</p>
                  </div>
                  <p className="text-sm mt-1">{m.text}</p>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-500">No messages.</div>
            )}
          </div>
        </div>
      </section>

      {/* RIGHT: ERP */}
      <section className="md:col-span-1">
        <ERPPanel erp={ticket.erp} />
      </section>
    </div>
  );
}
