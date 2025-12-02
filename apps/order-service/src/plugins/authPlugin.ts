import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

const JWKS_URI = process.env.JWKS_URI;
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const JWT_ALGORITHMS: jwt.Algorithm[] = ["RS256"];

if (!JWKS_URI) {
  throw new Error("JWKS_URI environment variable is not set");
}
if (!KEYCLOAK_ISSUER) {
  throw new Error("KEYCLOAK_ISSUER environment variable is not set");
}

const client = new JwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
  if (!header.kid) {
    callback(new Error("Token must contain a 'kid' header"), undefined);
    return;
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, undefined);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
};

async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      // 1. Kiểm tra Header
      const authHeader = request.headers.authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        // ⭐ SỬA Ở ĐÂY: Dùng 'return' để dừng và gửi response ngay lập tức
        return reply.code(401).send({ message: "You're not logged in!" });
      }

      // 2. Kiểm tra Token rỗng
      const token = authHeader.split(" ")[1] as string;
      if (!token) {
        // ⭐ SỬA Ở ĐÂY
        return reply.code(401).send({ message: "You're not logged in!" });
      }

      try {
        const decoded = await new Promise<jwt.JwtPayload | string>(
          (resolve, reject) => {
            jwt.verify(
              token,
              getKey,
              {
                issuer: KEYCLOAK_ISSUER,
                algorithms: JWT_ALGORITHMS,
              },
              (
                err: jwt.VerifyErrors | null,
                decodedToken: jwt.JwtPayload | string | undefined
              ) => {
                if (err) {
                  reject(err);
                } else {
                  if (decodedToken) {
                    resolve(decodedToken);
                  } else {
                    reject(new Error("Token decode failed"));
                  }
                }
              }
            );
          }
        );

        // Gán user vào request nếu thành công
        (request as any).user = decoded;
      } catch (error) {
        console.error("JWT Verification Error:", (error as Error).message);

        // ⭐ SỬA Ở ĐÂY: Bỏ 'throw', chỉ return response
        return reply.code(401).send({ message: "You're not logged in!" });
      }
    }
  );
}

export default fp(authPlugin);
