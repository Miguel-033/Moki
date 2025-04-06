const express = require("express");
require("dotenv").config();
const bot = require("./bot");

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("🤖 Moki bot is running (Render)");
});

app.post("/telegram", async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("❌ handleUpdate error:", err);
    res.status(200).send("OK");
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});