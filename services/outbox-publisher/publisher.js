const { Kafka } = require("kafkajs");
const { Pool } = require("pg");

const kafka = new Kafka({
  clientId: "outbox",
  brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function run() {
  await producer.connect();

  setInterval(async () => {
    const res = await db.query("SELECT * FROM outbox WHERE processed=false LIMIT 10");

    for (const row of res.rows) {
      await producer.send({
        topic: "notifications.main",
        messages: [{ value: JSON.stringify(row.payload) }]
      });

      await db.query("UPDATE outbox SET processed=true WHERE id=$1", [row.id]);
    }
  }, 3000);
}

run();
