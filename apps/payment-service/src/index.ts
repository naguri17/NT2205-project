import { serve } from "@hono/node-server";
import { Hono } from "hono";
import sessionRoute from "./routes/session.route.js";
import { cors } from "hono/cors";
import webhookRoute from "./routes/webhooks.route.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscription.js";

const app = new Hono();
// CORS Configuration - supports both local and production
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://app.lapisweb.online",
      "https://admin.lapisweb.online",
    ],
    credentials: true,
  }),
);

app.route("/sessions", sessionRoute);
app.route("/webhooks", webhookRoute);

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok", service: "payment-service" }));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectKafkaWithRetry = async (maxRetries = 5) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Kafka] Attempting to connect (attempt ${attempt}/${maxRetries})...`,
      );
      await producer.connect();
      await consumer.connect();
      console.log("[Kafka] Producer and consumer connected successfully");
      return true;
    } catch (error) {
      console.error(
        `[Kafka] Connection attempt ${attempt} failed:`,
        error instanceof Error ? error.message : error,
      );
      if (attempt === maxRetries) {
        console.warn("[Kafka] All connection attempts failed. Running without Kafka.");
        return false;
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`[Kafka] Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
  return false;
};

const start = async () => {
  // Start HTTP server first so health checks work
  serve({
    fetch: app.fetch,
    port: 8002,
  });
  console.log("Payment service HTTP server is running on port 8002");

  // Then connect to Kafka with retry (non-blocking)
  const kafkaConnected = await connectKafkaWithRetry();
  if (kafkaConnected) {
    await runKafkaSubscriptions();
    console.log("Payment service fully initialized with Kafka");
  } else {
    console.log("Payment service running without Kafka");
  }
};

start();
