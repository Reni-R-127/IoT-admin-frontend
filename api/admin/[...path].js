export default async function handler(req, res) {
  const backend = process.env.ADMIN_API_TARGET;
  const adminKey = process.env.ADMIN_API_KEY;

  if (!backend || !adminKey) {
    return res.status(500).json({
      message: "Admin API proxy is not configured in Vercel."
    });
  }

  const pathParts = req.query.path;
  const path = Array.isArray(pathParts)
    ? pathParts.map(encodeURIComponent).join("/")
    : "";

  const queryIndex = req.url.indexOf("?");
  const query = queryIndex >= 0 ? req.url.slice(queryIndex) : "";

  const target = `${backend.replace(/\/+$/, "")}/api/admin/${path}${query}`;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "x-admin-key": adminKey
      },
      ...(req.method !== "GET" && req.method !== "HEAD"
        ? { body: JSON.stringify(req.body ?? {}) }
        : {})
    });

    const text = await response.text();

    res.status(response.status);
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/json"
    );

    return res.send(text);
  } catch (error) {
    console.error("Admin proxy error:", error.message);
    return res.status(502).json({
      message: "Unable to connect to admin backend."
    });
  }
}