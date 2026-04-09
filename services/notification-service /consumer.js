const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [process.env.KAFKA_BROKER]
});

const consumer = kafka.consumer({ groupId: "notify-group" });

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: "notifications.main" });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log("NOTIFICATION:", message.value.toString());
    }
  });
}

run();
