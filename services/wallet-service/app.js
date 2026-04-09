const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");
const { sendEvent } = require("./kafka");

const app = express();
app.use(express.json());

app.get("/users", async (req, res) => {
  const users = await db.query("SELECT * FROM users");
  res.json(users.rows);
});

app.get("/transactions", async (req, res) => {
  const tx = await db.query("SELECT * FROM transactions ORDER BY created_at DESC");
  res.json(tx.rows);
});

app.post("/transfer", async (req, res) => {
  const { from, to, amount } = req.body;

  const event = {
    type: "TRANSFER",
    request_id: uuidv4(),
    from,
    to,
    amount
  };

  await sendEvent(event);

  res.json({ status: "PROCESSING", request_id: event.request_id });
});

app.listen(3000, () => console.log("wallet-service running"));
