/**
 * File: admin-frontend/src/components/settings/SettingsPage.jsx
 *
 * Purpose:
 * Super Admin security and password management.
 *
 * Features:
 * - Change temporary password on first login.
 * - Change existing Super Admin password anytime.
 * - Current password verification.
 * - New password validation.
 * - Confirm password validation.
 * - Backend password update.
 *
 * API:
 * POST /api/admin/settings/super-admin-password
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminRequest } from "../../services/adminApi";
import "./SettingsPage.css";


// ======================================================
// PASSWORD VALIDATION
// ======================================================

function validatePassword(password) {
  if (password.length < 14) {
    return "Password must contain at least 14 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Include at least one number.";
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    return "Include at least one special character.";
  }

  return "";
}


// ======================================================
// SETTINGS PAGE
// ======================================================

export default function SettingsPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");


  // ====================================================
  // HANDLE INPUT
  // ====================================================

  function change(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
    setNotice("");
  }


  // ====================================================
  // CHANGE SUPER ADMIN PASSWORD
  // ====================================================

  async function changePassword(event) {
    event.preventDefault();

    setError("");
    setNotice("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
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
      setError("New password must be different from your current password.");
      return;
    }

    setSaving(true);

    try {
      const response = await adminRequest(
        "/settings/super-admin-password",
        {
          method: "POST",
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      navigate("/login", {
        replace: true,
        state: {
          message:
            response?.message ||
            "Password changed successfully. Please sign in again.",
        },
      });

    } catch (err) {
      console.error("Super Admin password update failed:", err);

      setError(
        err.message ||
        "Password update failed. Please try again."
      );

    } finally {
      setSaving(false);
    }
  }


  // ====================================================
  // RENDER
  // ====================================================

  return (
    <section className="page settings-page">

      {/* PAGE HEADER */}

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            ADMINISTRATION / SECURITY
          </span>

          <h1>Settings &amp; security</h1>

          <p>
            Protect the master-admin account and manage workspace security.
          </p>
        </div>
      </div>


      {/* SECURITY NOTICE */}

      <div className="notice">
        Your Super Admin password is securely verified and
        stored as a hashed value in the backend database.
        Never share your password with staff.
      </div>


      {/* ERROR */}

      {error && (
        <div className="alert error-alert" role="alert">
          {error}
        </div>
      )}


      {/* SUCCESS */}

      {notice && (
        <div className="alert success-alert" role="status">
          {notice}
        </div>
      )}


      <div className="settings-grid">

        {/* ==========================================
            CHANGE PASSWORD
        ========================================== */}

        <div className="settings-card">

          <h2>Change Super Admin password</h2>

          <p>
            Set your permanent password during your first login.
            You can also change it anytime from this page.
          </p>


          <form
            className="form-stack"
            onSubmit={changePassword}
          >

            {/* CURRENT PASSWORD */}

            <label className="field">
              Current password

              <input
                type="password"
                autoComplete="current-password"
                required
                value={form.currentPassword}
                onChange={(event) =>
                  change("currentPassword", event.target.value)
                }
                placeholder="Enter current password"
              />
            </label>


            {/* NEW PASSWORD */}

            <label className="field">
              New password

              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={14}
                value={form.newPassword}
                onChange={(event) =>
                  change("newPassword", event.target.value)
                }
                placeholder="Enter new password"
              />
            </label>


            {/* CONFIRM PASSWORD */}

            <label className="field">
              Confirm new password

              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={14}
                value={form.confirmPassword}
                onChange={(event) =>
                  change("confirmPassword", event.target.value)
                }
                placeholder="Confirm new password"
              />
            </label>


            {/* PASSWORD RULES */}

            <div className="password-requirements">
              <strong>Password requirements</strong>

              <ul>
                <li>Minimum 14 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Updating password..."
                : "Update password"}
            </button>

          </form>

        </div>


        {/* ==========================================
            SECURITY CHECKLIST
        ========================================== */}

        <div className="settings-card">

          <h2>Security checklist</h2>

          <ul className="security-list">

            <li>
              <span>✓</span>

              <div>
                <strong>Strong password</strong>

                <p>
                  Use a unique password and store it in
                  a password manager.
                </p>
              </div>
            </li>


            <li>
              <span>✓</span>

              <div>
                <strong>Backend-enforced permissions</strong>

                <p>
                  Validate staff permissions on every API request.
                </p>
              </div>
            </li>


            <li>
              <span>✓</span>

              <div>
                <strong>Secrets kept server-side</strong>

                <p>
                  MongoDB credentials and Admin API keys must
                  never use frontend VITE variables.
                </p>
              </div>
            </li>


            <li>
              <span>✓</span>

              <div>
                <strong>Session security</strong>

                <p>
                  Revoke existing sessions after password changes.
                </p>
              </div>
            </li>

          </ul>

        </div>


        {/* ==========================================
            WORKSPACE CONFIGURATION
        ========================================== */}

        <div className="settings-card">

          <h2>Workspace configuration</h2>

          <p>
            API and database settings are configured
            through backend environment variables.
          </p>

          <div className="config-row">
            <span>Admin API</span>
            <strong>/api/admin</strong>
          </div>

          <div className="config-row">
            <span>Database</span>
            <strong>MongoDB</strong>
          </div>

          <div className="config-row">
            <span>Authentication</span>
            <strong>JWT based</strong>
          </div>

          <div className="config-row">
            <span>Password storage</span>
            <strong>Bcrypt hash</strong>
          </div>

        </div>

      </div>

    </section>
  );
}