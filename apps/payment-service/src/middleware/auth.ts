import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

// --- ENVIRONMENT CONFIGURATION ---
// Lưu ý: Hono có cách lấy env khác một chút, nhưng trong Node.js dùng process.env vẫn ổn
const JWKS_URI = process.env.JWKS_URI;
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const JWT_ALGORITHMS: jwt.Algorithm[] = ["RS256"];

if (!JWKS_URI) throw new Error("JWKS_URI is not set");
if (!KEYCLOAK_ISSUER) throw new Error("KEYCLOAK_ISSUER is not set");

// 1. Khởi tạo JWKS Client (Giống hệt bên Fastify)
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

// 2. Middleware Hono
export const authMiddleware = async (c: Context, next: Next) => {
  // A. Lấy Header
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "You're not logged in!" }, 401);
  }

  // B. Lấy Token
  const token = authHeader.split(" ")[1];
  if (!token) {
    return c.json({ message: "You're not logged in!" }, 401);
  }

  try {
    // C. Xác minh Token (Dùng Promise wrapper giống bên Fastify)
    const decoded = await new Promise<jwt.JwtPayload | string>(
      (resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            issuer: KEYCLOAK_ISSUER,
            algorithms: JWT_ALGORITHMS,
          },
          (err, decodedToken) => {
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

    // D. Gán user vào Context để dùng ở các route sau
    // Hono dùng c.set() để lưu biến cục bộ cho request
    c.set("user", decoded);

    // Chạy tiếp sang handler tiếp theo
    await next();
  } catch (error) {
    console.error("JWT Error:", (error as Error).message);
    return c.json({ message: "You're not logged in!" }, 401);
  }
};

export const adminMiddleware = async (c: Context, next: Next) => {
  // Lấy user từ context (đã được authMiddleware set vào)
  const user = c.get("user");

  // Kiểm tra roles
  const roles = user?.realm_access?.roles || [];

  if (!roles.includes("admin")) {
    return c.json({ message: "Forbidden: Admin access required" }, 403);
  }

  await next();
};
