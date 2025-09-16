// src/components/TicketDetail.jsx
import { useRef, useState, useMemo, useEffect } from "react";
import ERPPanel from "./ERPPanel";

const AGENTS = ["Agent One", "Agent Two"];
const TYPE_OPTIONS = ["-", "Question", "Incident", "Problem", "Task"]; // empty by default
const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];

export default function TicketDetail({ ticket, onBack }) {
  // composer state
  const [replyType, setReplyType] = useState("public"); // 'public' | 'internal'
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]); // File[]
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // header form state
  const [requester, setRequester] = useState(ticket?.requester || "");
  const [assignee, setAssignee] = useState(ticket?.agent || AGENTS[0]);
  const [type, setType] = useState(ticket?.type || TYPE_OPTIONS[0]);
  const [priority, setPriority] = useState(ticket?.priority || "Normal");
  const [tags, setTags] = useState(
    ticket?.tags && ticket.tags.length ? ticket.tags : ["zendesk_accelerated_setup"]
  );
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (!ticket) return;
    setRequester(ticket.requester || "");
    setAssignee(ticket.agent || AGENTS[0]);
    setType(ticket.type || TYPE_OPTIONS[0]);
    setPriority(ticket.priority || "Normal");
    setTags(ticket.tags && ticket.tags.length ? ticket.tags : ["zendesk_accelerated_setup"]);
    setMessage("");
    setAttachments([]);
    setReplyType("public");
  }, [ticket]);

  const messages = useMemo(
    () => [
      { from: "Customer", time: "Yesterday 19:29", text: "Hello, let's see how you or your agents can easily respond to and solve tickets." },
      { from: "Customer", time: "Yesterday 19:29", text: "Feel free to send additional test inquiries to support@software-6493.zendesk.com." },
      { from: "Agent", time: "Today 10:05", text: "Thanks for reaching out! Could you share your order ID so I can check ERP status?" },
    ],
    []
  );

  const erp = useMemo(() => (ticket ? getMockErpFromTicket(ticket) : null), [ticket]);

  const onAttachImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const onAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const removeAttachment = (name) => {
    setAttachments((prev) => prev.filter((f) => f.name !== name));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));
  const onTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const onSaveHeader = () => {
    alert("Ticket fields saved (demo).");
  };
  const onSend = () => {
    setMessage("");
    setAttachments([]);
    alert(`${replyType === "public" ? "Public reply" : "Internal note"} sent (demo).`);
  };

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No ticket selected.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* LEFT: Header + Conversation */}
      <section className="md:col-span-2 space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* ⬇️ Updated Back button: black bg, white text */}
              <button
                onClick={onBack}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                ← Back to Tickets
              </button>
              <h3 className="text-lg font-semibold">
                Ticket #{ticket.id} — {ticket.subject}
              </h3>
            </div>
            <button
              onClick={onSaveHeader}
              className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Save
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Requester */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Requester</label>
              <input
                type="text"
                value={requester}
                onChange={(e) => setRequester(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Assignee</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              >
                {AGENTS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Tags</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={onTagKeyDown}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs"
                  >
                    {t}
                    <button onClick={() => removeTag(t)} className="text-gray-500 hover:text-gray-700">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Conversation Card */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          {/* Messages */}
          <div className="p-4 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${m.from === "Agent" ? "bg-blue-50" : "bg-gray-50"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{m.from}</p>
                  <p className="text-xs text-gray-500">{m.time}</p>
                </div>
                <p className="text-sm mt-1">{m.text}</p>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="p-4 border-t space-y-3">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setReplyType("public")}
                className={`rounded-lg px-3 py-1.5 text-sm border transition
                  ${replyType === "public" ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
              >
                Send reply
              </button>
              <button
                onClick={() => setReplyType("internal")}
                className={`rounded-lg px-3 py-1.5 text-sm border transition
                  ${replyType === "internal" ? "bg-black text-white border-black" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"}`}
              >
                Add internal note
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              {replyType === "public" ? "Public reply" : "Internal note"}
            </label>
            <textarea
              placeholder={replyType === "public" ? "Write a public reply…" : "Write an internal note…"}
              className="w-full border rounded-lg p-3 min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {/* Attachments */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Attach Image
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={onAttachImages}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Attach File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onAttachFiles}
              />
            </div>

            {/* Attachment list */}
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((f) => (
                  <div key={f.name} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                    <span className="truncate pr-2">{f.name}</span>
                    <button
                      onClick={() => removeAttachment(f.name)}
                      className="text-xs rounded px-2 py-0.5 border hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="pt-1 flex flex-wrap gap-2">
              <button
                onClick={onSend}
                className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                {replyType === "public" ? "Send Reply" : "Add Note"}
              </button>
              <button
                onClick={() => { setMessage(""); setAttachments([]); }}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: ERP */}
      <section className="md:col-span-1">
        <ERPPanel erp={erp} />
      </section>
    </div>
  );
}

/** Demo ERP data */
function getMockErpFromTicket(ticket) {
  const n = Number(String(ticket.id).slice(-2));
  const statusPool = ["Processing", "Pending", "Shipped"];
  const status = statusPool[n % statusPool.length];

  return {
    orderId: `ERP-${1000 + (n % 50)}`,
    status,
    customer: {
      name: (ticket.requester || "").split("@")[0] || "Customer",
      email: ticket.requester || "customer@example.com",
    },
    items: [
      { sku: "X123", name: "CFexpress™ v4 Type A", qty: (n % 3) + 1 },
      { sku: "Y456", name: "Card Reader CFast 2.0", qty: 1 },
    ],
    totals: { subtotal: "€199.00", shipping: "€10.00", total: "€209.00" },
    shipments: status === "Shipped"
      ? [{ id: `SHP-${2100 + (n % 90)}`, carrier: "DHL", tracking: "DHL123456789", eta: "3–5 days" }]
      : [],
    invoices: [{ id: `INV-${3100 + (n % 120)}`, amount: "€209.00" }],
  };
}
