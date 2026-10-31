/**
 * File: admin-frontend/src/components/staff/StaffPage.jsx
 *
 * Purpose:
 * Super Admin staff directory, custom role form, and page permissions.
 *
 * Workflow:
 * - Create Staff with email and a backend-generated temporary password.
 * - Enter any role name as free text (no role dropdown).
 * - Click View Permissions to open the page checklist.
 * - Save permissions; backend revokes old Staff sessions.
 */

import { useEffect, useState } from "react";
import { adminRequest } from "../../services/adminApi";
import "./StaffPage.css";

const PAGE_PERMISSIONS = [
  { key: "overview", label: "Overview", description: "Dashboard summary and metrics" },
  { key: "courses", label: "Courses", description: "Create, edit and manage courses" },
  { key: "blogs", label: "Blog posts", description: "Manage blog content and publishing" },
  { key: "pricing", label: "Pricing", description: "Manage pricing plans" },
  { key: "projects", label: "Project lab", description: "Manage project showcase content" },
  { key: "testimonials", label: "Student testimonials", description: "Manage student testimonials" },
  { key: "enquiries", label: "Enquiries", description: "View and update enquiries" },
  { key: "notifications", label: "Notifications", description: "View and manage notifications" },
  { key: "reviews", label: "Reviews", description: "Manage and approve reviews" },
];

const PERMISSION_KEYS = new Set(PAGE_PERMISSIONS.map(({ key }) => key));
const EMPTY_FORM = { name: "", email: "", role: "", active: true };

function getId(item) {
  return item?._id || item?.id;
}

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [permissionStaff, setPermissionStaff] = useState(null);
  const [permissionDraft, setPermissionDraft] = useState([]);
  const [temporaryCredentials, setTemporaryCredentials] = useState(null);
  const [copyNotice, setCopyNotice] = useState("");

  async function loadStaff() {
    setLoading(true);
    setError("");
    try {
      const response = await adminRequest("/staff");
      const items = Array.isArray(response)
        ? response
        : response?.items || response?.staff || response?.data || [];
      setStaff(Array.isArray(items) ? items : []);
    } catch (err) {
      setError(err.message || "Unable to load Staff records.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  function startAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setTemporaryCredentials(null);
    setCopyNotice("");
  }

  function startEdit(item) {
    setEditing(item);
    setForm({
      name: item.name || "",
      email: item.email || "",
      role: item.role || "",
      active: item.active !== false,
    });
    setError("");
    setNotice("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openPermissions(item) {
    setPermissionStaff(item);
    setPermissionDraft(
      Array.isArray(item.permissions)
        ? item.permissions.filter((permission) => PERMISSION_KEYS.has(permission))
        : []
    );
    setError("");
    setNotice("");
  }

  function togglePermission(permission) {
    setPermissionDraft((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  }

  async function saveStaff(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role.trim(),
      active: Boolean(form.active),
    };

    if (!payload.name || !payload.email || !payload.role) {
      setError("Name, email and role are required.");
      return;
    }

    if (payload.role.length < 2 || payload.role.length > 60) {
      setError("Role must contain 2 to 60 characters.");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const id = getId(editing);
        await adminRequest(`/staff/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNotice("Staff details updated. The staff member must sign in again.");
        setEditing(null);
        setForm(EMPTY_FORM);
        await loadStaff();
        return;
      }

      const response = await adminRequest("/staff", {
        method: "POST",
        body: JSON.stringify({ ...payload, permissions: [] }),
      });

      const created = response?.staff;
      if (!created?.id && !created?._id) {
        throw new Error("The backend did not return the created Staff record.");
      }
      if (!response?.temporaryPassword) {
        throw new Error("Account created, but temporary password was not returned. Check the backend response before sharing credentials.");
      }

      setTemporaryCredentials({
        email: created.email,
        password: response.temporaryPassword,
      });
      setCopyNotice("");
      setNotice("Staff account created. Copy the temporary password now; it is shown only once.");
      setForm(EMPTY_FORM);
      setPermissionStaff(created);
      setPermissionDraft([]);
      await loadStaff();
    } catch (err) {
      setError(err.message || "Unable to save Staff account.");
    } finally {
      setSaving(false);
    }
  }

  async function savePermissions() {
    if (!permissionStaff) return;
    setSavingPermissions(true);
    setError("");

    try {
      const id = getId(permissionStaff);
      const response = await adminRequest(`/staff/${id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: permissionDraft }),
      });

      const updated = response?.staff;
      if (!updated) throw new Error("Backend did not return the updated Staff record.");

      setStaff((current) =>
        current.map((item) => (getId(item) === id ? { ...item, ...updated } : item))
      );
      setPermissionStaff(null);
      setNotice("Permissions saved. The staff member must sign in again for the changes to take effect.");
      await loadStaff();
    } catch (err) {
      setError(err.message || "Unable to update Staff permissions.");
    } finally {
      setSavingPermissions(false);
    }
  }

  async function disableStaff(item) {
    if (!window.confirm(`Disable access for ${item.email}? They will be signed out and cannot log in.`)) {
      return;
    }

    setError("");
    setNotice("");
    try {
      await adminRequest(`/staff/${getId(item)}`, { method: "DELETE" });
      setNotice(`Access disabled for ${item.email}.`);
      await loadStaff();
    } catch (err) {
      setError(err.message || "Unable to disable Staff access.");
    }
  }

  async function copyTemporaryPassword() {
    if (!temporaryCredentials?.password) return;
    try {
      await navigator.clipboard.writeText(temporaryCredentials.password);
      setCopyNotice("Temporary password copied.");
    } catch {
      setCopyNotice("Clipboard unavailable. Select and copy the password manually.");
    }
  }

  return (
    <section className="page staff-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCESS CONTROL</span>
          <h1>Staff &amp; permissions</h1>
          <p>Create Staff accounts, enter a custom role and choose exactly which Admin pages each person can access.</p>
        </div>
        <button type="button" className="secondary-button" onClick={startAdd}>
          + Add staff
        </button>
      </div>

      <div className="notice">
        Staff can access only pages selected in View Permissions. Staff Management and Super Admin Settings are always restricted to the Super Admin.
      </div>

      {error && <div className="alert error-alert" role="alert">{error}</div>}
      {notice && <div className="alert success-alert" role="status">{notice}</div>}

      {temporaryCredentials && (
        <div className="temporary-credentials" role="status">
          <div>
            <strong>Staff account created — copy this temporary password now</strong>
            <p>Email: {temporaryCredentials.email}</p>
            <code>{temporaryCredentials.password}</code>
            <small>This password is shown once only. Share it through a secure channel. Staff must create a new password at first login.</small>
            {copyNotice && <small>{copyNotice}</small>}
          </div>
          <button type="button" className="primary-button" onClick={copyTemporaryPassword}>Copy temporary password</button>
          <button type="button" className="secondary-button" onClick={() => setTemporaryCredentials(null)}>Hide</button>
        </div>
      )}

      <div className="staff-layout">
        <div className="settings-card">
          <h2>{editing ? "Edit staff member" : "Add staff member"}</h2>
          <p className="staff-form-hint">Role is a custom label you type. Actual access is controlled separately through View Permissions.</p>

          <form className="form-stack" onSubmit={saveStaff}>
            <label className="field">
              Full name
              <input required maxLength={100} value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Staff name" />
            </label>

            <label className="field">
              Work email
              <input type="email" required maxLength={254} value={form.email} onChange={(event) => updateForm("email", event.target.value)} placeholder="name@company.com" />
            </label>

            <label className="field">
              Role
              <input type="text" required minLength={2} maxLength={60} value={form.role} onChange={(event) => updateForm("role", event.target.value)} placeholder="Example: Course Manager" />
            </label>

            {editing && (
              <label className="permission-item staff-active-toggle">
                <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} />
                Account active
              </label>
            )}

            {!editing && <p className="staff-form-hint">New accounts start with no page access. Assign pages using View Permissions after creation.</p>}

            <div className="staff-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save changes" : "Create staff"}
              </button>
              {editing && <button type="button" className="secondary-button" onClick={startAdd}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="settings-card">
          <div className="panel-head">
            <div>
              <h2>Staff directory</h2>
              <p>{staff.length} Staff records</p>
            </div>
            <button type="button" className="secondary-button" onClick={loadStaff} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p>Loading Staff...</p>
          ) : staff.length === 0 ? (
            <div className="empty-media">
              <strong>No Staff records</strong>
              <p>Create a Staff account to begin assigning page access.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Permissions</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {staff.map((item) => (
                    <tr key={getId(item)}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.role}</td>
                      <td>{(item.permissions || []).filter((permission) => PERMISSION_KEYS.has(permission)).length} / {PAGE_PERMISSIONS.length}</td>
                      <td>
                        <span className={`badge ${item.active === false ? "staff-status-inactive" : "staff-status-active"}`}>
                          {item.active === false ? "Inactive" : "Active"}
                        </span>
                      </td>
                      <td>
                        <div className="staff-row-actions">
                          <button type="button" className="staff-text-button" onClick={() => openPermissions(item)}>View Permissions</button>
                          <button type="button" className="staff-text-button" onClick={() => startEdit(item)}>Edit</button>
                          {item.active !== false && <button type="button" className="staff-danger-button" onClick={() => disableStaff(item)}>Disable</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {permissionStaff && (
        <div className="staff-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !savingPermissions) setPermissionStaff(null);
        }}>
          <section className="staff-permission-modal" role="dialog" aria-modal="true" aria-labelledby="staff-permission-title">
            <header className="staff-modal-header">
              <div>
                <span className="eyebrow">PAGE ACCESS</span>
                <h2 id="staff-permission-title">View Permissions</h2>
                <p>{permissionStaff.name} · {permissionStaff.email} · {permissionStaff.role}</p>
              </div>
              <button type="button" className="staff-modal-close" aria-label="Close permissions" onClick={() => setPermissionStaff(null)} disabled={savingPermissions}>×</button>
            </header>

            <div className="staff-permission-summary">
              {permissionDraft.length} of {PAGE_PERMISSIONS.length} pages selected
            </div>

            <div className="staff-permission-grid">
              {PAGE_PERMISSIONS.map((page) => (
                <label className="staff-permission-option" key={page.key}>
                  <input type="checkbox" checked={permissionDraft.includes(page.key)} onChange={() => togglePermission(page.key)} />
                  <span>
                    <strong>{page.label}</strong>
                    <small>{page.description}</small>
                  </span>
                </label>
              ))}
            </div>

            {error && <div className="alert error-alert" role="alert">{error}</div>}

            <footer className="staff-modal-footer">
              <small>Staff Management and Settings are Super Admin-only and cannot be assigned.</small>
              <div>
                <button type="button" className="secondary-button" onClick={() => setPermissionStaff(null)} disabled={savingPermissions}>Cancel</button>
                <button type="button" className="primary-button" onClick={savePermissions} disabled={savingPermissions}>
                  {savingPermissions ? "Saving..." : "Save permissions"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
