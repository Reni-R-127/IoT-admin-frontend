/**
 * File: admin-frontend/src/pages/auth/FirstLoginPasswordPage.jsx
 *
 * Purpose:
 * Mandatory first-login Super Admin password creation.
 *
 * API:
 * POST /api/admin/settings/super-admin-password
 */

import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  adminRequest,
  getSuperAdminToken,
  clearSuperAdminSession,
} from "../../services/adminApi";

import "./AuthPages.css";

const MUST_CHANGE_PASSWORD_KEY =
  "superAdminMustChangePassword";

export default function FirstLoginPasswordPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const mustChange =
    sessionStorage.getItem(MUST_CHANGE_PASSWORD_KEY) === "true";

  if (!getSuperAdminToken()) {
    return <Navigate to="/login" replace />;
  }

  if (!mustChange) {
    return <Navigate to="/overview" replace />;
  }

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  }

  function validatePassword(password) {
    if (password.length < 14) {
      return "Password must contain at least 14 characters.";
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)
    ) {
      return "Use uppercase, lowercase, number and special character.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Complete all password fields.");
      return;
    }

    const validationError = validatePassword(newPassword);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must differ from your temporary password.");
      return;
    }

    setLoading(true);

    try {
      const result = await adminRequest(
        "/settings/super-admin-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      clearSuperAdminSession();

      sessionStorage.removeItem(
        MUST_CHANGE_PASSWORD_KEY
      );

      navigate("/login", {
        replace: true,
        state: {
          message:
            result?.message ||
            "Permanent password created. Please sign in again.",
        },
      });
    } catch (err) {
      console.error("First password creation failed:", err);

      setError(
        err.message || "Unable to create your permanent password."
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
          FIRST LOGIN SECURITY
        </span>

        <h1>Create your password</h1>

        <p className="admin-auth-description">
          Replace your temporary password before accessing
          the Admin Dashboard.
        </p>

        <div className="admin-auth-success">
          Create a private password that only you know.
          Use it for all future Admin logins.
        </div>

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
            Temporary password

            <input
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) =>
                updateField("currentPassword", event.target.value)
              }
              required
            />
          </label>

          <label className="admin-auth-field">
            New permanent password

            <input
              type="password"
              autoComplete="new-password"
              minLength={14}
              value={form.newPassword}
              onChange={(event) =>
                updateField("newPassword", event.target.value)
              }
              placeholder="Enter new password"
              required
            />
          </label>

          <label className="admin-auth-field">
            Confirm permanent password

            <input
              type="password"
              autoComplete="new-password"
              minLength={14}
              value={form.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              placeholder="Confirm new password"
              required
            />
          </label>

          <ul className="admin-auth-rules">
            <li>Minimum 14 characters</li>
            <li>At least one uppercase and lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>

          <button
            type="submit"
            className="admin-auth-button"
            disabled={loading}
          >
            {loading
              ? "Creating password..."
              : "Create permanent password"}
          </button>
        </form>

        <div className="admin-auth-footer">
          Your password is securely hashed by the backend.
        </div>

      </section>
    </main>
  );
}