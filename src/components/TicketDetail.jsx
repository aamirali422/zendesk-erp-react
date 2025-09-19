// src/components/TicketDetail.jsx
import { useRef, useState, useEffect, useMemo } from "react";
import ERPPanel from "./ERPPanel";
import { getTicket, listComments, updateTicket, postComment } from "@/lib/zdClient";

const TYPE_OPTIONS = ["-", "Question", "Incident", "Problem", "Task"];
const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];
const STATUS_OPTIONS = ["new", "open", "pending", "on_hold", "solved", "closed"];

// utils
const toLowerOrNull = (v) => (v && typeof v === "string" ? v.toLowerCase() : null);
const typeToApi = (v) => (v === "-" ? null : toLowerOrNull(v));
function toast(msg) {
  alert(msg);
}

export default function TicketDetail({ ticket, onBack }) {
  // composer state
  const [replyType, setReplyType] = useState("public");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // live ticket + comments
  const [zdTicket, setZdTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // cache sideloaded users/orgs
  const [ticketUsers, setTicketUsers] = useState([]);
  const [commentUsers, setCommentUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);

  // header form state
  const [requester, setRequester] = useState("");
  const [assignee, setAssignee] = useState("");
  const [type, setType] = useState(TYPE_OPTIONS[0]);
  const [priority, setPriority] = useState("Normal");
  const [status, setStatus] = useState("open");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Build maps
  const userMap = useMemo(() => {
    const all = [...ticketUsers, ...commentUsers];
    const map = new Map();
    for (const u of all) map.set(u.id, u);
    return map;
  }, [ticketUsers, commentUsers]);

  const orgMap = useMemo(() => {
    const map = new Map();
    for (const o of organizations) map.set(o.id, o);
    return map;
  }, [organizations]);

  const requesterUser = requester ? userMap.get(requester) : null;
  const assigneeUser = assignee ? userMap.get(assignee) : null;
  const org = zdTicket?.organization_id ? orgMap.get(zdTicket.organization_id) : null;

  const displayUser = (id) => {
    const u = userMap.get(id);
    return u?.name || u?.email || String(id);
  };

  // load ticket + comments
  useEffect(() => {
    if (!ticket?.id) return;
    (async () => {
      try {
        setLoading(true);
        const t = await getTicket(ticket.id);
        const c = await listComments(ticket.id);

        setZdTicket(t.ticket);
        setComments(c.comments || []);

        setTicketUsers(t.users || []);
        setOrganizations(t.organizations || []);
        setCommentUsers(c.users || []);

        setRequester(t.ticket.requester_id || "");
        setAssignee(t.ticket.assignee_id || "");
        setType(t.ticket.type || TYPE_OPTIONS[0]);
        setPriority(t.ticket.priority || "Normal");
        setStatus(t.ticket.status || "open");
        setTags(t.ticket.tags || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [ticket?.id]);

  // attach handlers
  const onAttachImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const onAttachFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setAttachments((prev) => [...prev, ...files]);
    e.target.value = "";
  };
  const removeAttachment = (name) => {
    setAttachments((prev) => prev.filter((f) => f.name !== name));
  };

  // tags
  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t) => setTags((prev) => prev.filter((x) => x !== t));
  const onTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  // save header
  const onSaveHeader = async () => {
    try {
      if (!requester) return toast("Requester is required (ID).");

      const patch = {
        requester_id: requester || null,
        assignee_id: assignee || null,
        type: typeToApi(type),
        priority: toLowerOrNull(priority),
        status,
        tags: Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))),
      };

      await updateTicket(ticket.id, patch);
      toast("Ticket fields saved.");
    } catch (err) {
      console.error(err);
      toast(`Save failed: ${err.message || "Unknown error"}`);
    }
  };

  // send reply/note
  const canComment = status !== "closed";
  const onSend = async () => {
    try {
      if (!canComment) return toast("This ticket is closed. You can't add comments.");

      const trimmed = (message || "").trim();
      const hasFiles = attachments.length > 0;
      const safeBody = trimmed || (hasFiles ? "Attachment(s) uploaded." : ""); // <-- fallback body for attachments-only

      if (!safeBody) {
        return toast("Type a message or attach at least one file.");
      }

      await postComment({
        id: ticket.id,
        body: safeBody, // <-- ensure Zendesk gets a non-empty body
        isPublic: replyType === "public",
        files: attachments,
      });

      const c = await listComments(ticket.id);
      setComments(c.comments || []);
      setCommentUsers(c.users || []);

      setMessage("");
      setAttachments([]);
      toast(replyType === "public" ? "Reply sent." : "Note added.");
    } catch (err) {
      console.error(err);
      toast(`Post failed: ${err.message || "Unknown error"}`);
    }
  };

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No ticket selected.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Loading ticket…
      </div>
    );
  }

  const erp = getMockErpFromTicket(ticket);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* LEFT: Header + Conversation */}
      <section className="md:col-span-2 space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                value={
                  requesterUser
                    ? `${requesterUser.name || ""} (${requesterUser.email || ""})`
                    : requester
                }
                onChange={(e) => setRequester(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-1 text-xs text-gray-500">ID: {requester || "—"}</p>
            </div>

            {/* Assignee */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Assignee</label>
              <input
                type="text"
                value={assigneeUser ? `${assigneeUser.name || ""}` : assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              />
              <p className="mt-1 text-xs text-gray-500">ID: {assignee || "—"}</p>
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
                    <button
                      onClick={() => removeTag(t)}
                      className="text-gray-500 hover:text-gray-700"
                    >
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

            {/* Status */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200 ${
                  status === "closed" ? "bg-gray-100 text-gray-500" : ""
                }`}
                disabled={status === "closed"}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Organization */}
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <p className="text-sm font-medium">Organization</p>
            <p className="text-sm text-gray-700">{org?.name ? org.name : "—"}</p>
          </div>
        </div>

        {/* Conversation */}
        <div className="rounded-2xl border border-gray-200 bg-white">
          <div className="p-4 space-y-3">
            {comments.map((c) => (
              <div key={c.id} className={`p-3 rounded-lg border ${c.public ? "bg-blue-50" : "bg-gray-50"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{displayUser(c.author_id)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                {!!c.attachments?.length && (
                  <div className="mt-2 space-y-1">
                    {c.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={att.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline break-all"
                      >
                        {att.file_name} ({Math.round(att.size / 1024)} KB)
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="p-4 border-t space-y-3">
            {!canComment && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                This ticket is <b>Closed</b>. You cannot add new comments. Create a follow-up ticket in Zendesk to continue the conversation.
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setReplyType("public")}
                className={`rounded-lg px-3 py-1.5 text-sm border transition ${
                  replyType === "public"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Send reply
              </button>
              <button
                onClick={() => setReplyType("internal")}
                className={`rounded-lg px-3 py-1.5 text-sm border transition ${
                  replyType === "internal"
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                }`}
              >
                Add internal note
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              {replyType === "public" ? "Public reply" : "Internal note"}
            </label>
            <textarea
              placeholder={
                replyType === "public" ? "Write a public reply…" : "Write an internal note…"
              }
              className="w-full border rounded-lg p-3 min-h-[120px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={!canComment}
            />

            {/* Attachments */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={!canComment}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Attach Image
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onAttachImages}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canComment}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
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

            {!!attachments.length && (
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

            <div className="pt-1 flex flex-wrap gap-2">
              <button
                onClick={onSend}
                disabled={!canComment || (!message.trim() && attachments.length === 0)}
                className={`rounded-lg px-4 py-2 text-white ${
                  !canComment || (!message.trim() && attachments.length === 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black hover:bg-gray-800"
                }`}
              >
                {replyType === "public" ? "Send Reply" : "Add Note"}
              </button>
              <button
                onClick={() => {
                  setMessage("");
                  setAttachments([]);
                }}
                className="rounded-lg border px-4 py-2 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT: ERP (unchanged for now) */}
      <section className="md:col-span-1">
        <ERPPanel erp={erp} />
      </section>
    </div>
  );
}

/** Demo ERP data (unchanged) */
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
    shipments: status === "Shipped" ? [{ id: `SHP-${2100 + (n % 90)}`, carrier: "DHL", tracking: "DHL123456789", eta: "3–5 days" }] : [],
    invoices: [{ id: `INV-${3100 + (n % 120)}`, amount: "€209.00" }],
  };
}
