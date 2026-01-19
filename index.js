const express = require("express");
const axios = require("axios"); // NEW
const app = express();

app.use(express.json());

// -------------------------------
// 🔐 TOKEN CACHE (IN-MEMORY)
// -------------------------------
let cachedToken = null;
let tokenExpiryTime = null;

// -------------------------------
// 🔁 FUNCTION TO GENERATE TOKEN
// -------------------------------
async function generateMicrosoftToken() {
  const url =
    "https://login.microsoftonline.com/e9d21387-43f1-4e06-a253-f9ed9096dc48/oauth2/v2.0/token";

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.CLIENT_ID);
  params.append("client_secret", process.env.CLIENT_SECRET);
  params.append("scope", "https://graph.microsoft.com/.default");

  const response = await axios.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  cachedToken = response.data.access_token;

  // subtract 60 seconds as buffer
  tokenExpiryTime = Date.now() + (response.data.expires_in - 60) * 1000;

  console.log("🆕 New Microsoft token generated");

  return cachedToken;
}

// -------------------------------
// ✅ GET VALID TOKEN (NEW API)
// -------------------------------
app.get("/get-valid-token", async (req, res) => {
  try {
    if (cachedToken && tokenExpiryTime && Date.now() < tokenExpiryTime) {
      console.log("♻️ Reusing existing token");
      return res.json({
        access_token: cachedToken,
        source: "cache",
      });
    }

    const newToken = await generateMicrosoftToken();
    return res.json({
      access_token: newToken,
      source: "new",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Token generation failed" });
  }
});

// -------------------------------
// 📧 EXISTING EMAIL API (UNCHANGED)
// -------------------------------
app.post("/email", (req, res) => {
  const { from, subject, body } = req.body;

  const replyMessage = `${body} and hello back from Agent`;

  return res.json({
    success: true,
    reply: replyMessage,
    original: { from, subject, body },
  });
});

// -------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
