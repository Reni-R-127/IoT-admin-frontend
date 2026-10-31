/**
 * File: admin-frontend/src/components/layout/AdminLayout.jsx
 * Purpose: Shared dashboard shell with role-aware logout.
 */

import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { adminLogout, getAuthSession } from "../../services/adminApi";
import "./AdminLayout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const session = getAuthSession();

  function handleLogout() {
    if (!window.confirm("Are you sure you want to logout?")) return;

    const destination = session?.type === "staff" ? "/staff-login" : "/login";
    adminLogout();
    navigate(destination, {
      replace: true,
      state: { message: "You have been signed out." },
    });
  }

  return (
    <div className="shell">
      <AdminSidebar />
      <main className="main">
        <div className="admin-topbar">
          <div className="admin-topbar-label">
            {session?.type === "staff"
              ? `${session.user?.name || "Staff"} · ${session.user?.role || "Staff"}`
              : "ProJenius Admin Workspace"}
          </div>
          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
            aria-label="Logout from Admin Dashboard"
          >
            <span aria-hidden="true">↪</span> Logout
          </button>
        </div>
        <div className="admin-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
