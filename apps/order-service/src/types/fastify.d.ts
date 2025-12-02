import { FastifyRequest, FastifyReply } from "fastify";
import { JwtPayload } from "jsonwebtoken";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: JwtPayload | string;
  }
}
