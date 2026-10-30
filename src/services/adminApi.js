const API_BASE_URL = "/api/admin";

export async function adminRequest(path, options = {}) {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      data.message || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
