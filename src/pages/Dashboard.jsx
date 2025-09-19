// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import AnalyticsCards from "../components/AnalyticsCards";
import TicketList from "../components/TicketList";    // ensure file is src/components/TicketList.jsx
import TicketDetail from "../components/TicketDetail";
import ReadonlyTicketDetail from "../components/ReadonlyTicketDetail";
import ProductsList from "../components/ProductsList";
import OrdersTable from "../components/OrdersTable";
import BackupRestore from "../components/BackupRestore";

export default function Dashboard() {
  const [view, setView] = useState("tickets");          // 'tickets' | 'products' | 'orders' | 'backup' | 'readonly-ticket'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketCategory, setTicketCategory] = useState(""); // 'tech-help' | 'data-recovery' | 'warranty-claim' | 'general-support' | ''
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [backupMode, setBackupMode] = useState("");     // '' | 'create' | 'restore'

  const navigate = useNavigate();

  // Server-side logout + local cleanup
  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("zdUser");
      localStorage.removeItem("zdSubdomain");
      navigate("/login");
    }
  };

  // Enrich a ticket so both detail views have nice data
  const enrichTicket = (t) => {
    if (!t) return t;
    const n = Number(String(t.id).slice(-2));
    const statusPool = ["Processing", "Pending", "Shipped"];
    const erpStatus = statusPool[n % statusPool.length];

    return {
      ...t,
      type: t.type ?? "-",
      priority: t.priority ?? "Normal",
      tags: t.tags && t.tags.length ? t.tags : ["zendesk_accelerated_setup"],
      messages:
        t.messages ??
        [
          { from: "Customer", time: "Yesterday 19:29", text: "Hello, I need help with my order." },
          { from: "Agent", time: "Today 10:05", text: "Thanks! Could you share your order ID so I can check ERP status?" },
        ],
      erp:
        t.erp ??
        {
          orderId: `ERP-${1000 + (n % 50)}`,
          status: erpStatus,
          customer: {
            name: (t.requester || t.requesterLabel || "").toString().split("@")[0] || "Customer",
            email: t.requester || t.requesterLabel || "customer@example.com",
          },
          items: [
            { sku: "X123", name: "CFexpress™ v4 Type A", qty: (n % 3) + 1 },
            { sku: "Y456", name: "Card Reader CFast 2.0", qty: 1 },
          ],
          totals: { subtotal: "€199.00", shipping: "€10.00", total: "€209.00" },
          shipments:
            erpStatus === "Shipped"
              ? [{ id: `SHP-${2100 + (n % 90)}`, carrier: "DHL", tracking: "DHL123456789", eta: "3–5 days" }]
              : [],
          invoices: [{ id: `INV-${3100 + (n % 120)}`, amount: "€209.00" }],
        },
    };
  };

  // Sidebar selections
  const handleSelect = (key) => {
    setSidebarOpen(false);

    // Tickets with subcategory
    if (key.startsWith("tickets:")) {
      const cat = key.split(":")[1] || "";
      setView("tickets");
      setTicketCategory(cat);
      setSelectedTicket(null);
      setBackupMode("");
      return;
    }

    if (key === "tickets") {
      setView("tickets");
      setTicketCategory("");
      setSelectedTicket(null);
      setBackupMode("");
      return;
    }

    // Backup & Restore (collapsible group)
    if (key.startsWith("backup:")) {
      const mode = key.split(":")[1]; // 'create' | 'restore'
      setView("backup");
      setBackupMode(mode);
      setSelectedTicket(null);
      setTicketCategory("");
      return;
    }

    if (key === "backup") {
      setView("backup");
      setBackupMode(""); // landing state
      setSelectedTicket(null);
      setTicketCategory("");
      return;
    }

    // Other sections
    setView(key); // 'products' | 'orders'
    setSelectedTicket(null);
    setTicketCategory("");
    setBackupMode("");
  };

  // From Tickets list: open editable detail (communicate)
  const openEditableTicket = (t) => {
    setSelectedTicket(enrichTicket(t));
    setView("tickets"); // TicketDetail renders when selectedTicket is set
  };

  // From Backup/Restore: open read-only detail
  const openReadonlyTicket = (t) => {
    setSelectedTicket(enrichTicket(t));
    setView("readonly-ticket");
  };

  // Back from read-only goes to Backup → Restore
  const backToBackupRestore = () => {
    setView("backup");
    setBackupMode("restore");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        onSelect={handleSelect}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Mobile header (menu + logo) */}
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-50"
            aria-label="Open menu"
          >
            <FiMenu />
          </button>
          <img
            src="https://www.angelbird.com/static/web/img/AB_Logo.svg"
            alt="Angelbird"
            className="h-6"
          />
        </div>

        {/* Tickets view */}
        {view === "tickets" && !selectedTicket && (
          <div className="space-y-4">
            <AnalyticsCards />
            <div className="bg-white rounded-lg shadow-md">
              <TicketList
                category={ticketCategory}
                onSelectTicket={openEditableTicket}        // editable TicketDetail
                onSelectTicketReadonly={openReadonlyTicket} // optional 2nd View for read-only
              />
            </div>
          </div>
        )}

        {/* Editable ticket detail (communicate) */}
        {view === "tickets" && selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onBack={() => setSelectedTicket(null)}
          />
        )}

        {/* Products */}
        {view === "products" && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <ProductsList />
          </div>
        )}

        {/* Orders */}
        {view === "orders" && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <OrdersTable />
          </div>
        )}

        {/* Backup & Restore */}
        {view === "backup" && (
          <BackupRestore
            mode={backupMode}           // '' | 'create' | 'restore'
            onView={openReadonlyTicket} // View inside BackupRestore → Readonly detail
          />
        )}

        {/* Read-only ticket detail (from Backup → Restore) */}
        {view === "readonly-ticket" && selectedTicket && (
          <ReadonlyTicketDetail
            ticket={selectedTicket}
            onBack={backToBackupRestore}
          />
        )}
      </main>
    </div>
  );
}
