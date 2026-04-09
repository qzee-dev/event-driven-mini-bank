const { Kafka } = require("kafkajs");
const { Pool } = require("pg");

const kafka = new Kafka({
  clientId: "transaction-service",
  brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: "tx-group" });
const producer = kafka.producer();

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function run() {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: "transactions.main" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const client = await db.connect();

      try {
        await client.query("BEGIN");

        const exist = await client.query(
          "SELECT 1 FROM transactions WHERE request_id=$1",
          [event.request_id]
        );

        if (exist.rowCount > 0) return;

        if (Math.random() < 0.2) throw new Error("fail");

        await client.query(
          "UPDATE users SET balance=balance-$1 WHERE id=$2",
          [event.amount, event.from]
        );

        await client.query(
          "UPDATE users SET balance=balance+$1 WHERE id=$2",
          [event.amount, event.to]
        );

        await client.query(
          "INSERT INTO transactions(request_id, from_user, to_user, amount, status) VALUES($1,$2,$3,$4,'SUCCESS')",
          [event.request_id, event.from, event.to, event.amount]
        );

        await client.query(
          "INSERT INTO outbox(event_type, payload) VALUES($1,$2)",
          ["TRANSFER_COMPLETED", event]
        );

        await client.query("COMMIT");

      } catch (err) {
        await client.query("ROLLBACK");
        console.error(err.message);
      } finally {
        client.release();
      }
    }
  });
}

run();
