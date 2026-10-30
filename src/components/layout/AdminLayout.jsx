import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";
export default function AdminLayout() {
  return (
    <div className="shell">
      <AdminSidebar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
