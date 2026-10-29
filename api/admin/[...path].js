export default async function handler(req, res) {
  const backendUrl = process.env.ADMIN_API_TARGET;
  const adminKey = process.env.ADMIN_API_KEY;

  if (!backendUrl || !adminKey) {
    return res.status(500).json({
      message: "Admin API proxy environment variables are missing.",
    });
  }

  if (adminKey.length < 32) {
    return res.status(500).json({
      message: "Admin API key configuration is invalid.",
    });
  }

  const requestUrl = new URL(req.url, "https://localhost");
  const targetUrl = new URL(
    `${requestUrl.pathname}${requestUrl.search}`,
    backendUrl.replace(/\/+$/, "") + "/"
  );

  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (
      value &&
      ![
        "host",
        "connection",
        "content-length",
        "x-admin-key",
      ].includes(key.toLowerCase())
    ) {
      headers.set(
        key,
        Array.isArray(value) ? value.join(", ") : value
      );
    }
  }

  headers.set("x-admin-key", adminKey);

  try {
    const options = {
      method: req.method,
      headers,
      redirect: "manual",
    };

    if (!["GET", "HEAD"].includes(req.method)) {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(chunk);
      }

      if (chunks.length > 0) {
        options.body = Buffer.concat(chunks);
      }
    }

    const response = await fetch(targetUrl, options);

    res.status(response.status);

    response.headers.forEach((value, key) => {
      if (
        ![
          "transfer-encoding",
          "content-encoding",
          "content-length",
        ].includes(key.toLowerCase())
      ) {
        res.setHeader(key, value);
      }
    });

    const data = Buffer.from(await response.arrayBuffer());

    return res.send(data);
  } catch (error) {
    console.error("Admin proxy error:", error.message);

    return res.status(502).json({
      message: "Unable to connect to the admin backend.",
    });
  }
}