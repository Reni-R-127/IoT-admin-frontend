/**
 * File: admin-frontend/src/components/layout/AdminSidebar.jsx
 * Purpose: Show only the navigation pages allowed for the current user.
 */

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Newspaper,
  Tags,
  Cpu,
  Video,
  Inbox,
  Bell,
  Star,
  Users,
  Settings,
  ExternalLink,
} from "lucide-react";

import { getAuthSession } from "../../services/adminApi";
import "./AdminSidebar.css";

const navigation = [
  { label: "Overview", path: "/overview", permission: "overview", Icon: LayoutDashboard },
  { label: "Courses", path: "/courses", permission: "courses", Icon: BookOpen },
  { label: "Blog posts", path: "/blogs", permission: "blogs", Icon: Newspaper },
  { label: "Pricing", path: "/pricing", permission: "pricing", Icon: Tags },
  { label: "Project lab", path: "/projects", permission: "projects", Icon: Cpu },
  { label: "Student Testimonials", path: "/testimonials", permission: "testimonials", Icon: Video },
  { label: "Enquiries", path: "/enquiries", permission: "enquiries", Icon: Inbox },
  { label: "Notifications", path: "/notifications", permission: "notifications", Icon: Bell },
  { label: "Reviews", path: "/reviews", permission: "reviews", Icon: Star },
  { label: "Staff & permissions", path: "/staff", superAdminOnly: true, Icon: Users },
  { label: "Settings & security", path: "/settings", superAdminOnly: true, Icon: Settings },
];

export default function AdminSidebar() {
  const session = getAuthSession();
  const isSuperAdmin = session?.type === "superadmin";
  const visibleNavigation = navigation.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin;
    if (isSuperAdmin) return true;
    return session?.type === "staff" && session.permissions?.includes(item.permission);
  });
  const websiteUrl = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandmark">PJ</div>
        <div>
          <b>ProJenius</b>
          <small>{isSuperAdmin ? "SUPER ADMIN" : "STAFF WORKSPACE"}</small>
        </div>
      </div>

      <div className="sidebar-label">WORKSPACE</div>
      <nav aria-label="Admin navigation">
        {visibleNavigation.map(({ label, path, Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav${isActive ? " active" : ""}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <a className="sidebar-website-link" href={websiteUrl} target="_blank" rel="noreferrer">
        <ExternalLink size={15} /> Main website
      </a>

      <div className="sidefoot">
        <span className="statusdot" />
        <span>{isSuperAdmin ? "Super Admin" : session?.user?.role || "Staff"}</span>
      </div>
    </aside>
  );
}
