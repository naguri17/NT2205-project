import Fastify from "fastify";
import authPlugin from "./plugins/authPlugin.js";
import cors from "@fastify/cors";
import { connectOrderDB } from "@repo/order-db";
import { orderRoute } from "./routes/order.js";

const fastify = Fastify();

fastify.register(authPlugin);
fastify.register(cors, {
  origin: ["http://localhost:3000", "http://localhost:3001"],
  methods: ["GET", "POST", "PUT", "DELETE"],
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
  }
);

fastify.get("/health", async (request, reply) => {
  return reply.status(200).send({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
  });
});

fastify.register(orderRoute);

const start = async () => {
  try {
    await connectOrderDB();
    await fastify.listen({ port: 8001 });
    console.log("Order service is running on port 8001");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
start();
