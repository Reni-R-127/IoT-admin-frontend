import { useEffect, useState } from "react";
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
  ArrowUpRight,
  RefreshCw,
  Plus,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import { Link } from "react-router-dom";
import { adminRequest } from "../../services/adminApi";
import "./Overview.css";

const sections = [
  {
    title: "Courses",
    path: "/courses",
    key: "courses",
    icon: BookOpen,
    description: "Manage courses and content",
    color: "teal",
  },
  {
    title: "Blog Posts",
    path: "/blogs",
    key: "blogs",
    icon: Newspaper,
    description: "Create and manage blog posts",
    color: "purple",
  },
  {
    title: "Pricing Plans",
    path: "/pricing",
    key: "pricing",
    icon: Tags,
    description: "Manage pricing and packages",
    color: "orange",
  },
  {
    title: "Project Lab",
    path: "/projects",
    key: "projects",
    icon: Cpu,
    description: "Manage projects and showcases",
    color: "blue",
  },
  {
    title: "Student Testimonials",
    path: "/testimonials",
    key: "testimonials",
    icon: Video,
    description: "Manage student testimonial videos",
    color: "teal",
  },
  {
    title: "Enquiries",
    path: "/enquiries",
    key: "enquiries",
    icon: Inbox,
    description: "View and manage enquiries",
    color: "purple",
  },
  {
    title: "Notifications",
    path: "/notifications",
    key: "notifications",
    icon: Bell,
    description: "Manage admin notifications",
    color: "orange",
  },
  {
    title: "Reviews",
    path: "/reviews",
    key: "reviews",
    icon: Star,
    description: "Review and approve submissions",
    color: "teal",
  },
  {
    title: "Staff & Permissions",
    path: "/staff",
    key: "staff",
    icon: Users,
    description: "Manage staff and access permissions",
    color: "blue",
  },
];

const countEndpoints = {
  courses: "/courses",
  blogs: "/blogs",
  pricing: "/pricing",
  projects: "/projects",
  testimonials: "/testimonials",
  enquiries: "/enquiries",
  notifications: "/notifications",
  reviews: "/reviews",
  staff: "/staff",
};

function getCount(data, key) {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (!data || typeof data !== "object") {
    return "—";
  }

  const possibleData =
    data[key] ??
    data.data ??
    data.items ??
    data.results;

  if (Array.isArray(possibleData)) {
    return possibleData.length;
  }

  if (typeof data.total === "number") {
    return data.total;
  }

  if (typeof data.count === "number") {
    return data.count;
  }

  if (typeof data.totalCount === "number") {
    return data.totalCount;
  }

  return "—";
}

export default function Overview() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadOverview() {
    setLoading(true);

    const entries = await Promise.all(
      Object.entries(countEndpoints).map(
        async ([key, endpoint]) => {
          try {
            const response = await adminRequest(endpoint);

            return [key, getCount(response, key)];
          } catch {
            return [key, "—"];
          }
        }
      )
    );

    setCounts(Object.fromEntries(entries));
    setLastUpdated(new Date().toLocaleTimeString());
    setLoading(false);
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const getCountForSection = (key) => {
    if (key === "overview") {
      return "Master";
    }

    if (loading) {
      return "…";
    }

    return counts[key] ?? "—";
  };

  return (
    <section className="page overview-page">
      {/* PAGE HEADER */}
      <header className="page-heading master-heading">
        <div>
          <span className="eyebrow">
            PROJENIUS / ADMIN
          </span>

          <h1>Welcome to ProJenius</h1>

          <p>
            Manage your website, content, student enquiries,
            staff and security from one workspace.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button master-refresh"
          onClick={loadOverview}
          disabled={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? "refresh-spinning" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {/* MASTER WORKSPACE BANNER */}
      <div className="overview-welcome">
        <div className="welcome-content">
          <span className="welcome-label">
            MASTER WORKSPACE
          </span>

          <h2>Your entire website, in one place.</h2>

          <p>
            Access every admin section, manage website content
            and control staff permissions from one dashboard.
          </p>
        </div>

        <div className="welcome-logo" aria-label="ProJenius">
          PJ
        </div>
      </div>

      {/* ALL ADMIN SECTIONS */}
      <div className="master-section-heading">
        <div>
          <span className="eyebrow">
            WORKSPACE DIRECTORY
          </span>

          <h2>All Admin Sections</h2>

          <p>
            Open any section to manage its content and settings.
          </p>
        </div>

        <span className="section-count">
          {sections.length} Sections
        </span>
      </div>

      <div className="master-sections-grid">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              to={section.path}
              key={section.key}
              className={`master-section-card card-${section.color}`}
            >
              <div className="master-card-top">
                <div className="master-card-icon">
                  <Icon size={20} strokeWidth={1.9} />
                </div>

                <ArrowUpRight
                  size={17}
                  className="master-card-arrow"
                />
              </div>

              <div className="master-card-content">
                <h3>{section.title}</h3>

                <p>{section.description}</p>
              </div>

              <div className="master-card-bottom">
                <strong>
                  {getCountForSection(section.key)}
                </strong>

                <span>
                  {section.key === "overview"
                    ? "Dashboard"
                    : "Manage"}
                  <ArrowUpRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* QUICK ACTIONS + SECURITY */}
      <div className="master-bottom-grid">
        <div className="master-info-card">
          <div className="master-info-heading">
            <div>
              <h2>Quick Actions</h2>

              <p>
                Quickly access frequently used admin tasks.
              </p>
            </div>

            <div className="master-info-icon">
              <Plus size={19} />
            </div>
          </div>

          <div className="master-quick-actions">
            <Link to="/courses">
              <BookOpen size={16} />
              <span>Add or manage courses</span>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/blogs">
              <Newspaper size={16} />
              <span>Create a blog post</span>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/testimonials">
              <Video size={16} />
              <span>Manage testimonials</span>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/enquiries">
              <Inbox size={16} />
              <span>View enquiries</span>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/staff">
              <Users size={16} />
              <span>Manage staff access</span>
              <ArrowUpRight size={14} />
            </Link>

            <Link to="/settings">
              <Settings size={16} />
              <span>Open settings</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="master-info-card master-security-card">
          <div className="master-info-heading">
            <div>
              <h2>Security & Access</h2>

              <p>
                Keep your ProJenius admin workspace secure.
              </p>
            </div>

            <div className="master-info-icon">
              <ShieldCheck size={19} />
            </div>
          </div>

          <div className="security-message">
            <ShieldCheck size={22} />

            <div>
              <h3>Protect your admin account</h3>

              <p>
                Use a strong, unique password and give staff
                only the permissions required for their roles.
              </p>
            </div>
          </div>

          <Link
            to="/settings"
            className="master-security-link"
          >
            Open security settings
            <ExternalLink size={14} />
          </Link>

          <div className="master-last-updated">
            <span className="status-indicator" />

            <span>
              {loading
                ? "Updating dashboard data..."
                : `Last refreshed: ${lastUpdated || "—"}`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}