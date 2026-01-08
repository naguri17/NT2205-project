import Fastify from "fastify";
import authPlugin from "./plugins/authPlugin.js";
import cors from "@fastify/cors";
import { connectOrderDB } from "@repo/order-db";
import { orderRoute } from "./routes/order.js";
import { consumer, producer } from "./utils/kafka.js";
import { runKafkaSubscriptions } from "./utils/subscription.js";

const fastify = Fastify();

fastify.register(authPlugin);
// CORS Configuration - supports both local and production
fastify.register(cors, {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://app.lapisweb.online",
    "https://admin.lapisweb.online",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
});

// Health check endpoint
fastify.get("/health", async () => {
  return { status: "ok", service: "order-service" };
});

fastify.get(
  "/test",
  {
    preHandler: (req, reply) => fastify.authenticate(req, reply),
  },
  async (request, reply) => {
    return reply.status(200).send({
      message: "Order service authenticated",
    });
  },
);

fastify.register(orderRoute);

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
  try {
    // Connect to database first
    await connectOrderDB();
    console.log("[DB] Order database connected");

    // Start HTTP server so health checks work
    await fastify.listen({ port: 8001, host: "0.0.0.0" });
    console.log("Order service HTTP server is running on port 8001");

    // Then connect to Kafka with retry (non-blocking)
    const kafkaConnected = await connectKafkaWithRetry();
    if (kafkaConnected) {
      await runKafkaSubscriptions();
      console.log("Order service fully initialized with Kafka");
    } else {
      console.log("Order service running without Kafka");
    }
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
};

start();
