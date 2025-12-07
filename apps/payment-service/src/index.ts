import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { uptime } from "process";
import sessionRoute from "./routes/session.route.js";
import { cors } from "hono/cors";
import webhookRoute from "./routes/webhooks.route.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscription.js";

const app = new Hono();
app.use(
  "/*",
  cors({
    origin: ["http://localhost:3000"],
  })
);

app.route("/sessions", sessionRoute);
app.route("/webhooks", webhookRoute);

const start = async () => {
  try {
    Promise.all([await producer.connect(), await consumer.connect()]);
    await runKafkaSubscriptions();

    serve({
      fetch: app.fetch,
      port: 8002,
    });
    console.log("Payment service is running on port 8002");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
