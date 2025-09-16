// src/pages/Dashboard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import AnalyticsCards from "../components/AnalyticsCards";
import TicketsList from "../components/TicketsList";


import TicketDetail from "../components/TicketDetail";
import ProductsList from "../components/ProductsList";
import OrdersTable from "../components/OrdersTable";

export default function Dashboard() {
  const [view, setView] = useState("tickets");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketCategory, setTicketCategory] = useState(""); // ← holds submenu category
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  // Sidebar selection handler
  const handleSelect = (key) => {
    if (key.startsWith("tickets:")) {
      // keys: tickets:tech-help | data-recovery | warranty-claim | general-support
      const cat = key.split(":")[1] || "";
      setView("tickets");
      setTicketCategory(cat);
      setSelectedTicket(null);
      return;
    }
    if (key === "tickets") {
      setView("tickets");
      setTicketCategory(""); // no category filter
      setSelectedTicket(null);
      return;
    }
    // products / orders
    setView(key);
    setTicketCategory("");
    setSelectedTicket(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar onSelect={handleSelect} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto p-6">
        {view === "tickets" && !selectedTicket && (
          <div className="space-y-4">
            <AnalyticsCards />
            <div className="bg-white rounded-lg shadow-md">
              {/* Pass the category from submenu */}
              <TicketsList
                category={ticketCategory}     // ← drives filter
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
