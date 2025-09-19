/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
// src/components/Sidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiChevronRight, FiChevronDown, FiX } from "react-icons/fi";

export default function Sidebar({ onSelect, onLogout, isOpen = false, onClose = () => {} }) {
  const [ticketsOpen, setTicketsOpen] = useState(true);
  const [backupOpen, setBackupOpen] = useState(false);

  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      // optional: console.warn("Logout request failed (continuing):", e);
    }
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("zdUser");
    localStorage.removeItem("zdSubdomain");

    // Call parent hook if provided (keeps old behavior working)
    if (typeof onLogout === "function") {
      try { onLogout(); } catch {}
    }

    navigate("/login");
  }

  const handleMainTickets = () => {
    onSelect("tickets");
    onClose();
    setTicketsOpen((v) => !v);
  };

  const handleMainBackup = () => {
    onSelect("backup");
    onClose();
    setBackupOpen((v) => !v);
  };

  const go = (key) => {
    onSelect(key);
    onClose();
  };

  const Panel = (
    <div
      className={`
        fixed inset-y-0 left-0 z-40 w-72 max-w-[80%] bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-out shadow-lg
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:w-64 md:shadow-none
        flex flex-col p-4
      `}
    >
      {/* Mobile-only header */}
      <div className="mb-4 flex items-center justify-between md:hidden">
        <img src="https://www.angelbird.com/static/web/img/AB_Logo.svg" alt="Angelbird Logo" className="h-8" />
        <button onClick={onClose} className="rounded p-2 hover:bg-gray-100" aria-label="Close sidebar">
          <FiX />
        </button>
      </div>

      {/* Desktop logo */}
      <div className="hidden md:flex items-center justify-center mb-4">
        <img src="https://www.angelbird.com/static/web/img/AB_Logo.svg" alt="Angelbird Logo" className="h-10" />
      </div>

      <nav className="flex-1 space-y-1">
        {/* Zendesk Tickets */}
        <button
          onClick={handleMainTickets}
          className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100"
        >
          <span className="font-medium">Zendesk Tickets</span>
          {ticketsOpen ? <FiChevronDown className="text-black" /> : <FiChevronRight className="text-black" />}
        </button>

        {ticketsOpen && (
          <div className="ml-2 pl-4 border-l border-gray-200 space-y-1 py-1">
            <button onClick={() => go("tickets:tech-help")} className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">Tech help</button>
            <button onClick={() => go("tickets:data-recovery")} className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">Data recovery</button>
            <button onClick={() => go("tickets:warranty-claim")} className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">Warranty claim</button>
            <button onClick={() => go("tickets:general-support")} className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">General support</button>
          </div>
        )}

        {/* Products & Orders */}
        <button onClick={() => go("products")} className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-100">
          Products <FiChevronRight className="text-black" />
        </button>
        <button onClick={() => go("orders")} className="w-full flex justify-between items-center px-3 py-2 rounded hover:bg-gray-100">
          Orders <FiChevronRight className="text-black" />
        </button>

        {/* Backup & Restore (collapsible) */}
        <button
          onClick={handleMainBackup}
          className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-gray-100"
        >
          <span className="font-medium">Backup &amp; Restore</span>
          {backupOpen ? <FiChevronDown className="text-black" /> : <FiChevronRight className="text-black" />}
        </button>

        {backupOpen && (
          <div className="ml-2 pl-4 border-l border-gray-200 space-y-1 py-1">
            <button onClick={() => go("backup:get")} className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">
              Get backup from Zendesk
            </button>
            <button onClick={() => go("backup:restore")} className="w-full text-left text-sm px-3 py-2 rounded hover:bg-gray-100">
              Restore backup from DB
            </button>
          </div>
        )}
      </nav>

      {/* Logout */}
      <button
        onClick={() => { handleLogout(); onClose(); }}
        className="mt-auto w-full flex justify-between items-center px-3 py-2 rounded bg-black text-white hover:bg-gray-800"
      >
        Logout <FiLogOut className="text-white" />
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {Panel}
    </>
  );
}
