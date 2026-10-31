/**
 * File: admin-frontend/src/App.jsx
 * Purpose: Authentication-aware routes and Staff page permissions.
 */

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import AdminLayout from "./components/layout/AdminLayout";
import Overview from "./components/dashboard/Overview";
import CoursesPage from "./pages/CoursesPage";
import BlogsPage from "./pages/BlogsPage";
import PricingPage from "./pages/PricingPage";
import ProjectLabPage from "./pages/ProjectLabPage";
import EnquiriesPage from "./components/enquiries/EnquiriesPage";
import NotificationsPage from "./components/notifications/NotificationsPage";
import ReviewsPage from "./components/reviews/ReviewsPage";
import StudentTestimonialsPage from "./components/testimonials/StudentTestimonialsPage";
import StaffPage from "./components/staff/StaffPage";
import SettingsPage from "./components/settings/SettingsPage";

import LoginPage from "./pages/auth/LoginPage";
import StaffLoginPage from "./pages/auth/StaffLoginPage";
import FirstLoginPasswordPage from "./pages/auth/FirstLoginPasswordPage";
import StaffFirstLoginPasswordPage from "./pages/auth/StaffFirstLoginPasswordPage";

import { getAuthSession } from "./services/adminApi";
import "./styles/global.css";

const ADMIN_MUST_CHANGE_KEY = "superAdminMustChangePassword";
const STAFF_MUST_CHANGE_KEY = "staffMustChangePassword";

const STAFF_PAGE_ORDER = [
  ["overview", "/overview"],
  ["courses", "/courses"],
  ["blogs", "/blogs"],
  ["pricing", "/pricing"],
  ["projects", "/projects"],
  ["testimonials", "/testimonials"],
  ["enquiries", "/enquiries"],
  ["notifications", "/notifications"],
  ["reviews", "/reviews"],
];

function getFirstAllowedPath(session) {
  if (!session || session.type === "superadmin") return "/overview";
  const permissions = new Set(session.permissions || []);
  return STAFF_PAGE_ORDER.find(([permission]) => permissions.has(permission))?.[1] || "/no-access";
}

function AccessDeniedPage() {
  return (
    <section className="page">
      <div className="settings-card">
        <span className="eyebrow">ACCESS CONTROL</span>
        <h1>Page access not assigned</h1>
        <p>
          Your Staff account does not have permission to open this page.
          Contact the Super Admin to update your page permissions.
        </p>
      </div>
    </section>
  );
}

function AuthenticatedAdminLayout() {
  const location = useLocation();
  const session = getAuthSession();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const storage = window.sessionStorage;
  if (
    session.type === "superadmin" &&
    storage.getItem(ADMIN_MUST_CHANGE_KEY) === "true"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (
    session.type === "staff" &&
    storage.getItem(STAFF_MUST_CHANGE_KEY) === "true"
  ) {
    return <Navigate to="/staff-first-login" replace />;
  }

  return <AdminLayout />;
}

function PermissionRoute({ permission, superAdminOnly = false, children }) {
  const session = getAuthSession();

  if (!session) return <Navigate to="/login" replace />;
  if (session.type === "superadmin") return children;
  if (superAdminOnly) return <AccessDeniedPage />;
  if (!permission || !session.permissions?.includes(permission)) {
    return <AccessDeniedPage />;
  }
  return children;
}

function DashboardStart() {
  return <Navigate to={getFirstAllowedPath(getAuthSession())} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/staff-login" element={<StaffLoginPage />} />
        <Route path="/change-password" element={<FirstLoginPasswordPage />} />
        <Route path="/staff-first-login" element={<StaffFirstLoginPasswordPage />} />

        <Route element={<AuthenticatedAdminLayout />}>
          <Route index element={<DashboardStart />} />
          <Route path="/no-access" element={<AccessDeniedPage />} />

          <Route path="/overview" element={<PermissionRoute permission="overview"><Overview /></PermissionRoute>} />
          <Route path="/courses" element={<PermissionRoute permission="courses"><CoursesPage /></PermissionRoute>} />
          <Route path="/blogs" element={<PermissionRoute permission="blogs"><BlogsPage /></PermissionRoute>} />
          <Route path="/pricing" element={<PermissionRoute permission="pricing"><PricingPage /></PermissionRoute>} />
          <Route path="/projects" element={<PermissionRoute permission="projects"><ProjectLabPage /></PermissionRoute>} />
          <Route path="/testimonials" element={<PermissionRoute permission="testimonials"><StudentTestimonialsPage /></PermissionRoute>} />
          <Route path="/enquiries" element={<PermissionRoute permission="enquiries"><EnquiriesPage /></PermissionRoute>} />
          <Route path="/notifications" element={<PermissionRoute permission="notifications"><NotificationsPage /></PermissionRoute>} />
          <Route path="/reviews" element={<PermissionRoute permission="reviews"><ReviewsPage /></PermissionRoute>} />
          <Route path="/staff" element={<PermissionRoute superAdminOnly><StaffPage /></PermissionRoute>} />
          <Route path="/settings" element={<PermissionRoute superAdminOnly><SettingsPage /></PermissionRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
