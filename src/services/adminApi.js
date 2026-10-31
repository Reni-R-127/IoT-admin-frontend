/**
 * File: admin-frontend/src/api/adminApi.js
 *
 * Purpose:
 * Central API handler for Admin Dashboard.
 *
 * Authentication:
 * - Super Admin: API key injected by backend proxy.
 * - Staff: JWT Bearer token from sessionStorage.
 *
 * Features:
 * - Automatic JWT attachment.
 * - Staff login and logout.
 * - JSON and FormData support.
 * - API error handling.
 * - Automatic session cleanup after password change.
 */

const API_BASE_URL = "/api/admin";

const STAFF_TOKEN_KEY = "staffToken";


// ======================================================
// SESSION STORAGE HELPERS
// ======================================================

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}


// ======================================================
// GET STAFF TOKEN
// ======================================================

export function getStaffToken() {
  const storage = getSessionStorage();

  if (!storage) return null;

  return storage.getItem(STAFF_TOKEN_KEY);
}


// ======================================================
// SAVE STAFF SESSION
// ======================================================

export function setStaffSession(loginResponse) {
  if (!loginResponse?.token) {
    throw new Error("Valid staff authentication token is missing.");
  }

  const storage = getSessionStorage();

  if (!storage) {
    throw new Error("Browser session storage is unavailable.");
  }

  storage.setItem(STAFF_TOKEN_KEY, loginResponse.token);

  return loginResponse;
}


// ======================================================
// CLEAR STAFF SESSION
// ======================================================

export function clearStaffSession() {
  const storage = getSessionStorage();

  if (!storage) return;

  storage.removeItem(STAFF_TOKEN_KEY);
}


// ======================================================
// STAFF LOGIN
// ======================================================

export async function staffLogin(email, password) {
  const result = await adminRequest("/staff/login", {
    method: "POST",

    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      password: String(password || ""),
    }),

    // Login must not send an old staff token.
    auth: false,
  });

  if (!result?.token) {
    throw new Error("Staff login failed. Authentication token not received.");
  }

  setStaffSession(result);

  return result;
}


// ======================================================
// STAFF LOGOUT
// ======================================================

export function staffLogout() {
  clearStaffSession();
}


// ======================================================
// API REQUEST
// ======================================================

export async function adminRequest(path, options = {}) {
  const {
    auth = true,
    ...fetchOptions
  } = options;

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const endpoint = `${API_BASE_URL}${normalizedPath}`;

  const isFormData =
    typeof FormData !== "undefined" &&
    fetchOptions.body instanceof FormData;

  const headers = new Headers(fetchOptions.headers || {});

  headers.set(
    "Accept",
    "application/json"
  );

  // Add JSON content type only when a request body exists.
  // FormData must set its own multipart boundary.
  if (
    fetchOptions.body !== undefined &&
    fetchOptions.body !== null &&
    !isFormData &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  // --------------------------------------------------
  // AUTOMATIC STAFF JWT ATTACHMENT
  // --------------------------------------------------

  const isLoginRequest =
    normalizedPath.split("?")[0] === "/staff/login";

  let tokenAttached = false;

  if (auth && !isLoginRequest && !headers.has("Authorization")) {
    const token = getStaffToken();

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );

      tokenAttached = true;
    }
  }

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers,
    });

    // ------------------------------------------------
    // READ RESPONSE
    // ------------------------------------------------

    let data = null;

    if (response.status !== 204) {
      const responseText = await response.text();

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
      }
    }

    // ------------------------------------------------
    // HANDLE API ERRORS
    // ------------------------------------------------

    if (!response.ok) {
      // Invalid or expired staff JWT.
      if (response.status === 401 && tokenAttached) {
        clearStaffSession();
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (typeof data === "string" ? data : null) ||
        `Request failed with status ${response.status}`;

      throw new Error(errorMessage);
    }

    // ------------------------------------------------
    // PASSWORD CHANGE SESSION CLEANUP
    // ------------------------------------------------

    const isPasswordChangeRequest =
      normalizedPath.split("?")[0] === "/staff/change-password";

    if (
      isPasswordChangeRequest &&
      data?.mustLoginAgain === true
    ) {
      clearStaffSession();
    }

    // ------------------------------------------------
    // SUCCESS RESPONSE
    // ------------------------------------------------

    return data;

  } catch (error) {
    throw error;
  }
}