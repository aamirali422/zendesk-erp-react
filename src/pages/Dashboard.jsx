// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";

import Sidebar from "../components/Sidebar";
import AnalyticsCards from "../components/AnalyticsCards";
import TicketsList from "../components/TicketList";
import TicketDetail from "../components/TicketDetail";
import ProductsList from "../components/ProductsList";
import OrdersTable from "../components/OrdersTable";

export default function Dashboard() {
  const [view, setView] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketCategory, setTicketCategory] = useState(""); // from sidebar submenus
  const [isSidebarOpen, setSidebarOpen] = useState(false);   // ← mobile drawer

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  const handleSelect = (key) => {
    // Close drawer on mobile after navigation
    setSidebarOpen(false);

    if (key.startsWith("tickets:")) {
      const cat = key.split(":")[1] || "";
      setView("tickets");
      setTicketCategory(cat);
      setSelectedTicket(null);
      return;
    }
    if (key === "tickets") {
      setView("tickets");
      setTicketCategory("");
      setSelectedTicket(null);
      return;
    }
    setView(key);         // products | orders
    setTicketCategory("");
    setSelectedTicket(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (desktop inline, mobile drawer) */}
      <Sidebar
        onSelect={handleSelect}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}          // ← controls mobile open
        onClose={() => setSidebarOpen(false)} // ← close from overlay / X
      />

      {/* Main area */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Mobile top bar with hamburger */}
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

        {view === "tickets" && !selectedTicket && (
          <div className="space-y-4">
            <AnalyticsCards />
            <div className="bg-white rounded-lg shadow-md">
              <TicketsList
                category={ticketCategory}
                onSelectTicket={setSelectedTicket}
              />
            </div>
          </div>
        )}

        {view === "tickets" && selectedTicket && (
          <TicketDetail
            ticket={selectedTicket}
            onBack={() => setSelectedTicket(null)}
          />
        )}

        {view === "products" && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <ProductsList />
          </div>
        )}

        {view === "orders" && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <OrdersTable />
          </div>
        )}
      </main>
    </div>
  );
}
