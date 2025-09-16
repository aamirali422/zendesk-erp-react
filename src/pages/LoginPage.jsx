import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "demo@angelbird.com",
    password: "Angelbird#2025",
    zendeskSubdomain: "angelbird",
    erpBaseUrl: "https://erp.angelbird.example",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", formData);

    // Simulate login
    if (
      formData.username === "demo@angelbird.com" &&
      formData.password === "Angelbird#2025"
    ) {
      // Set login flag for ProtectedRoute
      localStorage.setItem("isLoggedIn", "true");

      // Redirect to dashboard
      navigate("/dashboard");
    } else {
      alert("Invalid credentials!");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Sign in to Integration
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Use demo credentials and we will simulate calling both Zendesk & ERP APIs.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="email"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Zendesk + ERP Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Zendesk Subdomain
              </label>
              <input
                type="text"
                name="zendeskSubdomain"
                value={formData.zendeskSubdomain}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ERP Base URL
              </label>
              <input
                type="url"
                name="erpBaseUrl"
                value={formData.erpBaseUrl}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-indigo-300"
          >
            Login & Connect Both
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500">
          Demo creds:{" "}
          <span className="font-medium">
            demo@angelbird.com / Angelbird#2025
          </span>
        </p>
      </div>
    </div>
  );
}
