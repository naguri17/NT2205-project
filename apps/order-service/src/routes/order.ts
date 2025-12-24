import { FastifyInstance } from "fastify";
import { Order } from "@repo/order-db";

export const orderRoute = async (fastify: FastifyInstance) => {
  fastify.get(
    "/user-orders",
    { preHandler: (req, reply) => fastify.authenticate(req, reply) },
    async (request, reply) => {
      const orders = await Order.find({ userId: request.user.sub });

      return reply.send(orders);
    },
  );

  fastify.get(
    "/orders",
    {
      preHandler: [
        (req, reply) => fastify.authenticate(req, reply),
        (req, reply) => fastify.adminOnly(req, reply),
      ],
    },
    async (request, reply) => {
      const { limit } = request.query as { limit: number };
      const orders = await Order.find().limit(limit).sort({ createdAt: -1 });
      return reply.send(orders);
    },
  );
};
