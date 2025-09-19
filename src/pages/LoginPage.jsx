// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/lib/zdClient"; // <-- use the helper (handles apiUrl + ensureOk)

export default function LoginPage() {
  const navigate = useNavigate();

  // Prefilled for dev only. Remove/clear for production.
  const [formData, setFormData] = useState({
    email: "alex@codered-tech.com",
    token: "wwq0RELx5qj2ZxyFdocyMMdjaxTER6QL1ds0hGAZ",
    subdomain: "software-6493",
    erpBaseUrl: "https://erp.angelbird.example",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { email, token, subdomain } = formData;
      const resp = await login({
        email: email.trim(),
        token: token.trim(),
        subdomain: subdomain.trim(),
      });

      // Optional: store small hints for UX
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("zdUser", JSON.stringify(resp.user));
      localStorage.setItem("zdSubdomain", resp.subdomain);

      navigate("/dashboard");
    } catch (e2) {
      setErr(e2?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Sign in to Zendesk
        </h2>

        {err && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Zendesk Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Token
            </label>
            <input
              type="password"
              name="token"
              value={formData.token}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              autoComplete="current-password"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Zendesk Admin → Apps and Integrations → APIs → Add API token.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Zendesk Subdomain
            </label>
            <input
              type="text"
              name="subdomain"
              value={formData.subdomain}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
              placeholder="e.g. software-6493"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              API base: https://<b>{formData.subdomain || "your-subdomain"}</b>.zendesk.com/api/v2
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ERP Base URL (optional)
            </label>
            <input
              type="url"
              name="erpBaseUrl"
              value={formData.erpBaseUrl}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
          >
            {loading ? "Connecting…" : "Login & Connect"}
          </button>
        </form>
      </div>
    </div>
  );
}
