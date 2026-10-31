/**
 * File: admin-frontend/src/pages/auth/StaffFirstLoginPasswordPage.jsx
 *
 * Purpose:
 * Require every new Staff member to replace the temporary password
 * before accessing pages assigned by the Super Admin.
 *
 * API:
 * POST /api/admin/staff/change-password
 */

import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  adminRequest,
  getStaffToken,
} from "../../services/adminApi";

import "./AuthPages.css";

const MUST_CHANGE_PASSWORD_KEY = "staffMustChangePassword";

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
    return "Use uppercase, lowercase, a number and a special character.";
  }

  return "";
}

export default function StaffFirstLoginPasswordPage() {
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

  if (!getStaffToken()) {
    return <Navigate to="/staff-login" replace />;
  }

  if (!mustChange) {
    return <Navigate to="/no-access" replace />;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
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

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from the temporary password.");
      return;
    }

    setLoading(true);

    try {
      await adminRequest("/staff/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      sessionStorage.removeItem(MUST_CHANGE_PASSWORD_KEY);

      // adminRequest clears the Staff token because the backend requires
      // a fresh login after tokenVersion is incremented.
      navigate("/staff-login", {
        replace: true,
        state: {
          message:
            "Password changed successfully. Sign in with your new password.",
        },
      });
    } catch (err) {
      console.error("Staff first-login password change failed:", err);
      setError(err.message || "Unable to update your password.");
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
          FIRST LOGIN SECURITY
        </span>

        <h1>Create your password</h1>

        <p className="admin-auth-description">
          Replace the temporary password provided by your Super Admin.
          Dashboard access stays locked until this step is complete.
        </p>

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
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={14}
              value={form.newPassword}
              onChange={(event) =>
                updateField("newPassword", event.target.value)
              }
              placeholder="Create your own password"
              required
            />
          </label>

          <label className="admin-auth-field">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={14}
              value={form.confirmPassword}
              onChange={(event) =>
                updateField("confirmPassword", event.target.value)
              }
              placeholder="Confirm your password"
              required
            />
          </label>

          <ul className="admin-auth-rules">
            <li>Minimum 14 characters</li>
            <li>One uppercase and one lowercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>

          <button
            type="submit"
            className="admin-auth-button"
            disabled={loading}
          >
            {loading ? "Updating password..." : "Create staff password"}
          </button>
        </form>

        <p className="admin-auth-switch">
          <Link to="/staff-login">Back to Staff Login</Link>
        </p>
      </section>
    </main>
  );
}
