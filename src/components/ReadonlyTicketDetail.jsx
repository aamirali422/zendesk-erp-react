// src/components/ReadonlyTicketDetail.jsx
export default function ReadonlyTicketDetail({ ticket, onBack }) {
  if (!ticket) {
    return <div className="p-6 text-sm text-gray-500">No ticket selected.</div>;
  }

  const {
    id, subject, requester, agent, status, tags = [],
    type = "-", priority = "Normal", organization = "—",
    messages = [], erp,
  } = ticket;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              ← Back
            </button>
            <h3 className="text-lg font-semibold">
              Ticket #{id} — {subject}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Requester" value={requester || "—"} />
          <Field label="Agent" value={agent || "Unassigned"} />
          <Field label="Type" value={type} />
          <Field label="Priority" value={priority} />
          <Field label="Status" value={String(status || "").toUpperCase()} />
          <Field label="Organization" value={organization || "—"} />
          <div className="sm:col-span-2">
            <div className="mb-1 text-sm font-medium text-gray-700">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.length
                ? tags.map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                      {t}
                    </span>
                  ))
                : <span className="text-sm text-gray-500">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <h4 className="mb-2 text-sm font-semibold">Conversation (read-only)</h4>
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className="rounded-lg border bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.from || "Message"}</p>
                  <p className="text-xs text-gray-500">{m.time || ""}</p>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{m.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No messages.</p>
        )}
      </div>

      {/* Optional ERP sidecar (simple read-only) */}
      {erp && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h4 className="mb-2 text-sm font-semibold">ERP Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Field label="Order ID" value={erp.orderId} />
            <Field label="Status" value={erp.status} />
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
