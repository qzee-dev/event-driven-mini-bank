const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "wallet-service",
  brokers: [process.env.KAFKA_BROKER]
});

const producer = kafka.producer();

async function sendEvent(event) {
  await producer.connect();
  await producer.send({
    topic: "transactions.main",
    messages: [{ value: JSON.stringify(event) }]
  });
}

module.exports = { sendEvent };
