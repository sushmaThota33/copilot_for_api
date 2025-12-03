const express = require("express");
const app = express();

app.use(express.json());

app.post("/email", (req, res) => {
  const { from, subject, body } = req.body;

  const replyMessage = `${body} and hello back from Agent`;

  return res.json({
    success: true,
    reply: replyMessage,
    original: { from, subject, body }
  });
});

app.listen(3000, () => console.log("API running on port 3000"));
