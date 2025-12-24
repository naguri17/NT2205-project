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

const start = async () => {
  try {
    Promise.all([
      await connectOrderDB(),
      await producer.connect(),
      await consumer.connect(),
    ]);

    await runKafkaSubscriptions();

    await fastify.listen({ port: 8001 });
    console.log("Order service is running on port 8001");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();
