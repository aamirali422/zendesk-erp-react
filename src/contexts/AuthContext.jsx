// src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession as apiGetSession, login as apiLogin, logout as apiLogout } from "@/lib/zdClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subdomain, setSubdomain] = useState(null);
  const navigate = useNavigate();

  // Check session on first load/refresh
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setAuthLoading(true);
        const data = await apiGetSession(); // GET /api/session
        if (!alive) return;
        setIsLoggedIn(true);
        setUser(data.user || null);
        setSubdomain(data.subdomain || null);
      } catch {
        if (!alive) return;
        setIsLoggedIn(false);
        setUser(null);
        setSubdomain(null);
      } finally {
        if (alive) setAuthLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Call server /api/login, then set state
  const login = async ({ email, token, subdomain }) => {
    const resp = await apiLogin({ email, token, subdomain }); // POST /api/login
    setIsLoggedIn(true);
    setUser(resp.user || null);
    setSubdomain(resp.subdomain || null);
    // small UX hint in localStorage (not security)
    localStorage.setItem("isLoggedIn", "true");
  };

  // Call server /api/logout, clear client state
  const logout = async () => {
    try { await apiLogout(); } catch {}
    setIsLoggedIn(false);
    setUser(null);
    setSubdomain(null);
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, authLoading, user, subdomain, login, logout, setIsLoggedIn }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
