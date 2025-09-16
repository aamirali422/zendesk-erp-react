import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isLoggedIn"); // check login flag

  if (!isAuthenticated) {
    // Not logged in, redirect to login
    return <Navigate to="/" replace />;
  }

  return children;
}
