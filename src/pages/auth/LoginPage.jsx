/**
 * File: admin-frontend/src/pages/auth/LoginPage.jsx
 *
 * Purpose:
 * Super Admin login page.
 *
 * Login:
 * Email + Password
 *
 * First login:
 * Redirect to mandatory password creation.
 */

import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  superAdminLogin,
  getSuperAdminToken,
} from "../../services/adminApi";

import "./AuthPages.css";

const MUST_CHANGE_PASSWORD_KEY =
  "superAdminMustChangePassword";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getMustChangePassword() {
    return (
      sessionStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === "true"
    );
  }

  if (getSuperAdminToken()) {
    return (
      <Navigate
        to={
          getMustChangePassword()
            ? "/change-password"
            : "/overview"
        }
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await superAdminLogin(
        email.trim().toLowerCase(),
        password
      );

      const mustChange = Boolean(
        result.mustChangePassword
      );

      sessionStorage.setItem(
        MUST_CHANGE_PASSWORD_KEY,
        String(mustChange)
      );

      if (mustChange) {
        navigate("/change-password", {
          replace: true,
        });
      } else {
        navigate(
          location.state?.from?.pathname || "/overview",
          { replace: true }
        );
      }
    } catch (err) {
      console.error("Admin login failed:", err);

      setError(
        err.message || "Login failed. Check your credentials."
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
            <small>ADMIN CONTROL PANEL</small>
          </div>
        </div>

        <span className="admin-auth-eyebrow">
          SECURE ADMINISTRATION
        </span>

        <h1>Admin Login</h1>

        <p className="admin-auth-description">
          Sign in with your registered Super Admin email
          and password.
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
            Email address

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="admin-auth-switch">
          Staff member? <Link to="/staff-login">Staff sign in</Link>
        </p>

        <div className="admin-auth-footer">
          ProJenius Admin · Secure Access
        </div>

      </section>
    </main>
  );
}