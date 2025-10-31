const fetch = require("node-fetch");

module.exports = async function handler(req, res) {
  // Enable CORS (using headers from vercel.json)
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.method === "GET" && req.url.endsWith("/health")) {
    return res.status(200).json({ status: "ok" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages, model = "llama3-8b-8192" } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      // Demo mode fallback
      return res.status(200).json({
        choices: [
          {
            message: {
              content:
                "I'm currently in demo mode. To get live AI responses, please configure your GROQ_API_KEY in the Vercel environment variables. This is a helpful educational response showing how the AI assistant would work with a proper API key configured.",
            },
          },
        ],
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          model,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Groq API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Groq API error:", error);
    res.status(500).json({
      error: "Failed to process AI request",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
