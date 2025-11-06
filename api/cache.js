// Vercel Serverless Function for Cache Management
module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    // Get cache stats
    return res.status(200).json({
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      cacheSize: 0,
      config: {
        lessons: { duration: 600000, maxSize: 50 },
        health: { duration: 120000, maxSize: 10 },
        default: { duration: 300000, maxSize: 100 }
      },
      uptime: 0,
      message: "Cache stats (demo mode - no actual caching in serverless)"
    });
  }

  if (req.method === "POST") {
    // Clear cache
    return res.status(200).json({
      message: "Cache cleared successfully (demo mode)",
      previousSize: 0,
      currentSize: 0
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};