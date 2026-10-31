/**
 * File: admin-frontend/src/services/adminApi.js
 *
 * Purpose:
 * Central API client and browser-session helpers for Admin and Staff.
 *
 * Authentication:
 * - Super Admin JWT
 * - Staff JWT
 *
 * Security:
 * - Tokens are kept in sessionStorage for this application.
 * - Never place API keys, JWT secrets, or database credentials in VITE_ variables.
 * - Backend verifies current account status and permissions on every request.
 */

const API_BASE_URL = (
  import.meta.env.VITE_ADMIN_API_BASE_URL || "/api/admin"
).trim().replace(/\/+$/, "");

const KEYS = Object.freeze({
  adminToken: "superAdminToken",
  staffToken: "staffToken",
  adminProfile: "superAdminSession",
  staffProfile: "staffSession",
  adminMustChange: "superAdminMustChangePassword",
  staffMustChange: "staffMustChangePassword",
});

function getStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson(key) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  const storage = getStorage();
  if (!storage) throw new Error("Browser session storage is unavailable.");
  storage.setItem(key, JSON.stringify(value));
}

export function getSuperAdminToken() {
  return getStorage()?.getItem(KEYS.adminToken) || null;
}

export function getStaffToken() {
  return getStorage()?.getItem(KEYS.staffToken) || null;
}

export function getAuthSession() {
  if (getSuperAdminToken()) {
    return {
      type: "superadmin",
      user: readJson(KEYS.adminProfile) || {},
      permissions: null,
    };
  }

  if (getStaffToken()) {
    const profile = readJson(KEYS.staffProfile)?.staff || {};
    return {
      type: "staff",
      user: profile,
      permissions: Array.isArray(profile.permissions)
        ? profile.permissions
        : [],
    };
  }

  return null;
}

export function setSuperAdminSession(loginResponse) {
  if (!loginResponse?.token || !loginResponse?.admin) {
    throw new Error("Super Admin login response is incomplete.");
  }

  const storage = getStorage();
  if (!storage) throw new Error("Browser session storage is unavailable.");

  clearStaffSession();
  storage.setItem(KEYS.adminToken, loginResponse.token);
  writeJson(KEYS.adminProfile, loginResponse.admin);
  storage.setItem(KEYS.adminMustChange, String(Boolean(loginResponse.mustChangePassword)));
  return loginResponse;
}

export function setStaffSession(loginResponse) {
  if (!loginResponse?.token || !loginResponse?.staff) {
    throw new Error("Staff login response is incomplete.");
  }

  const storage = getStorage();
  if (!storage) throw new Error("Browser session storage is unavailable.");

  clearSuperAdminSession();
  storage.setItem(KEYS.staffToken, loginResponse.token);
  writeJson(KEYS.staffProfile, {
    staff: {
      id: loginResponse.staff.id,
      name: loginResponse.staff.name,
      email: loginResponse.staff.email,
      role: loginResponse.staff.role,
      permissions: Array.isArray(loginResponse.staff.permissions)
        ? loginResponse.staff.permissions
        : [],
    },
  });
  storage.setItem(KEYS.staffMustChange, String(Boolean(loginResponse.mustChangePassword)));
  return loginResponse;
}

export function clearSuperAdminSession() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(KEYS.adminToken);
  storage.removeItem(KEYS.adminProfile);
  storage.removeItem(KEYS.adminMustChange);
}

export function clearStaffSession() {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(KEYS.staffToken);
  storage.removeItem(KEYS.staffProfile);
  storage.removeItem(KEYS.staffMustChange);
}

export function clearAuthSession() {
  clearSuperAdminSession();
  clearStaffSession();
}

export function adminLogout() {
  clearAuthSession();
}

export function superAdminLogout() {
  clearSuperAdminSession();
}

export function staffLogout() {
  clearStaffSession();
}

export async function superAdminLogin(email, password) {
  const result = await adminRequest("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      password: String(password || ""),
    }),
  });

  setSuperAdminSession(result);
  return result;
}

export async function staffLogin(email, password) {
  const result = await adminRequest("/staff/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      password: String(password || ""),
    }),
  });

  setStaffSession(result);
  return result;
}

export async function adminRequest(path, options = {}) {
  const { auth = true, ...fetchOptions } = options;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const cleanPath = normalizedPath.split("?")[0];
  const endpoint = `${API_BASE_URL}${normalizedPath}`;
  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set("Accept", "application/json");

  if (
    fetchOptions.body !== undefined &&
    fetchOptions.body !== null &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const isLoginRequest = cleanPath === "/auth/login" || cleanPath === "/staff/login";
  let attachedTokenType = null;

  if (auth && !isLoginRequest && !headers.has("Authorization")) {
    const adminToken = getSuperAdminToken();
    const staffToken = getStaffToken();

    if (adminToken) {
      headers.set("Authorization", `Bearer ${adminToken}`);
      attachedTokenType = "superadmin";
    } else if (staffToken) {
      headers.set("Authorization", `Bearer ${staffToken}`);
      attachedTokenType = "staff";
    }
  }

  let response;
  try {
    response = await fetch(endpoint, { ...fetchOptions, headers });
  } catch (cause) {
    const error = new Error(
      "Could not connect to the Admin API. Check the backend server and API URL."
    );
    error.cause = cause;
    throw error;
  }

  let data = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (attachedTokenType === "superadmin") clearSuperAdminSession();
      if (attachedTokenType === "staff") clearStaffSession();
    }

    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : "") ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.code = data?.code || null;
    throw error;
  }

  if (data?.mustLoginAgain === true) {
    if (cleanPath === "/settings/super-admin-password") clearSuperAdminSession();
    if (cleanPath === "/staff/change-password") clearStaffSession();
  }

  return data;
}
