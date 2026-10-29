const BACKEND_URL = "https://iot-admin-backend.onrender.com";

export default async function handler(req, res) {
  const apiKey = process.env.ADMIN_API_KEY;

  if (!apiKey || apiKey.length < 32) {
    return res.status(503).json({
      message: "Admin API is not configured on Vercel.",
    });
  }

  const path = Array.isArray(req.query.path)
    ? req.query.path.join("/")
    : req.query.path || "";

  const queryIndex = req.url.indexOf("?");
  const query = queryIndex >= 0 ? req.url.slice(queryIndex) : "";
  const targetUrl = `${BACKEND_URL}/api/admin/${path}${query}`;

  try {
    const headers = {
      "x-admin-key": apiKey,
    };

    if (req.headers["content-type"]) {
      headers["content-type"] = req.headers["content-type"];
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : JSON.stringify(req.body ?? {}),
    });

    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    const responseBody = await response.arrayBuffer();
    return res.status(response.status).send(Buffer.from(responseBody));
  } catch (error) {
    console.error("Admin API proxy error:", error.message);
    return res.status(502).json({
      message: "Unable to connect to the admin backend.",
    });
  }
}
