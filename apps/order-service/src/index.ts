import { clerkPlugin, getAuth } from "@clerk/fastify";
import Fastify from "fastify";

const fastify = Fastify();

fastify.register(clerkPlugin);

fastify.get("/test", async (request, reply) => {
  const { userId } = getAuth(request);

  if (!userId) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  return reply.send({ message: "Order service authenticated!" });
});

fastify.get("/health", async (request, reply) => {
  return reply.status(200).send({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
  });
});

const start = async () => {
  try {
    await fastify.listen({ port: 8001 });
    console.log("Order service is running on port 8001");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
