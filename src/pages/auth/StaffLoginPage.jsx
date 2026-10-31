/**
 * File: admin-frontend/src/pages/auth/StaffLoginPage.jsx
 *
 * Purpose:
 * Staff email/password login.
 *
 * First-time staff accounts are redirected to a forced password-change
 * page before any Admin workspace page can be opened.
 */

import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  staffLogin,
  getStaffToken,
  getAuthSession,
} from "../../services/adminApi";

import "./AuthPages.css";

const MUST_CHANGE_PASSWORD_KEY = "staffMustChangePassword";

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

function getFirstStaffPage(permissions = []) {
  const permissionSet = new Set(permissions);
  return (
    STAFF_PAGE_ORDER.find(([permission]) =>
      permissionSet.has(permission)
    )?.[1] || "/no-access"
  );
}

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (getStaffToken()) {
    const mustChange =
      sessionStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === "true";

    return (
      <Navigate
        to={
          mustChange
            ? "/staff-first-login"
            : getFirstStaffPage(getAuthSession()?.permissions || [])
        }
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your work email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await staffLogin(
        email.trim().toLowerCase(),
        password
      );

      const mustChange = Boolean(result.mustChangePassword);

      sessionStorage.setItem(
        MUST_CHANGE_PASSWORD_KEY,
        String(mustChange)
      );

      if (mustChange) {
        navigate("/staff-first-login", { replace: true });
      } else {
        navigate(
          getFirstStaffPage(result.staff.permissions || []),
          { replace: true }
        );
      }
    } catch (err) {
      console.error("Staff login failed:", err);
      setError(
        err.message || "Unable to sign in. Check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-auth-page">
      <section className="admin-auth-card">
        <div className="admin-auth-brand">
          <div className="admin-auth-logo">PJ</div>
          <div>
            <strong>ProJenius</strong>
            <small>STAFF WORKSPACE</small>
          </div>
        </div>

        <span className="admin-auth-eyebrow">
          STAFF ACCESS
        </span>

        <h1>Staff Login</h1>

        <p className="admin-auth-description">
          Sign in with the work email and temporary password provided
          by your Super Admin.
        </p>

        {location.state?.message && (
          <div className="admin-auth-success" role="status">
            {location.state.message}
          </div>
        )}

        {error && (
          <div className="admin-auth-error" role="alert">
            {error}
          </div>
        )}

        <form
          className="admin-auth-form"
          onSubmit={handleSubmit}
        >
          <label className="admin-auth-field">
            Work email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>

          <label className="admin-auth-field">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <button
            type="submit"
            className="admin-auth-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Staff sign in"}
          </button>
        </form>

        <p className="admin-auth-switch">
          Super Admin? <Link to="/login">Admin sign in</Link>
        </p>

        <div className="admin-auth-footer">
          Your available pages depend on permissions assigned by the Super Admin.
        </div>
      </section>
    </main>
  );
}
