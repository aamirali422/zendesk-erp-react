import { useEffect, useState } from "react";
import { getTicket, listComments } from "@/lib/zdClient";
import ReadonlyTicketDetail from "./ReadonlyTicketDetail";

export default function ReadonlyTicketDetailContainer({ baseTicket, onBack }) {
  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    if (!baseTicket?.id) return;
    (async () => {
      setLoading(true);
      try {
        const t = await getTicket(baseTicket.id);
        const c = await listComments(baseTicket.id);

        // Build maps for requester/assignee/org
        const users = t.users || [];
        const orgs = t.organizations || [];
        const userMap = new Map(users.map((u) => [u.id, u]));
        const orgMap = new Map(orgs.map((o) => [o.id, o]));

        const requesterUser = userMap.get(t.ticket.requester_id);
        const assigneeUser = userMap.get(t.ticket.assignee_id);
        const org = orgMap.get(t.ticket.organization_id);

        // Normalize comments → messages
        const messages = (c.comments || []).map((cm) => ({
          from: cm.public ? "Agent" : "Internal",
          time: new Date(cm.created_at).toLocaleString(),
          text: cm.body,
        }));

        setTicketData({
          id: t.ticket.id,
          subject: t.ticket.subject,
          requester: requesterUser?.name || requesterUser?.email || t.ticket.requester_id,
          agent: assigneeUser?.name || assigneeUser?.email || "Unassigned",
          tags: t.ticket.tags || [],
          type: t.ticket.type || "-",
          priority: t.ticket.priority || "Normal",
          status: t.ticket.status,
          organization: org?.name || "—",
          messages,
          erp: getMockErpFromTicket(t.ticket), // reuse same mock ERP logic
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [baseTicket?.id]);

  if (!baseTicket) {
    return <div className="p-6 text-sm text-gray-500">No ticket selected.</div>;
  }
  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading ticket…</div>;
  }

  return <ReadonlyTicketDetail ticket={ticketData} onBack={onBack} />;
}

/** Mock ERP just like in TicketDetail */
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
    shipments:
      status === "Shipped"
        ? [{ id: `SHP-${2100 + (n % 90)}`, carrier: "DHL", tracking: "DHL123456789", eta: "3–5 days" }]
        : [],
    invoices: [{ id: `INV-${3100 + (n % 120)}`, amount: "€209.00" }],
  };
}
