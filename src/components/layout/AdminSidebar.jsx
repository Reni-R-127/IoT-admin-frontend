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
import "./AdminSidebar.css";
const navigation = [
  { label: "Overview", path: "/overview", Icon: LayoutDashboard },
  { label: "Courses", path: "/courses", Icon: BookOpen },
  { label: "Blog posts", path: "/blogs", Icon: Newspaper },
  { label: "Pricing", path: "/pricing", Icon: Tags },
  { label: "Project lab", path: "/projects", Icon: Cpu },
  { label: "Student Testimonials", path: "/testimonials", Icon: Video },
  { label: "Enquiries", path: "/enquiries", Icon: Inbox },
  { label: "Notifications", path: "/notifications", Icon: Bell },
  { label: "Reviews", path: "/reviews", Icon: Star },
  { label: "Staff & permissions", path: "/staff", Icon: Users },
  { label: "Settings & security", path: "/settings", Icon: Settings },
];
export default function AdminSidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandmark">PJ</div>
        <div>
          <b>ProJenius</b>
          <small>ADMIN</small>
        </div>
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav>
        {navigation.map(({ label, path, Icon }) => (
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
      <a
        className="sidebar-website-link"
        href={import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173"}
        target="_blank"
        rel="noreferrer"
      >
        <ExternalLink size={15} /> Main website
      </a>
      <div className="sidefoot">
        <span className="statusdot" />
        <span>Admin workspace</span>
      </div>
    </aside>
  );
}
