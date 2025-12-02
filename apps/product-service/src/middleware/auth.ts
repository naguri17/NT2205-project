import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

// --- ENVIRONMENT CONFIGURATION ---
const JWKS_URI = process.env.JWKS_URI;
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const JWT_ALGORITHMS: jwt.Algorithm[] = ["RS256"];

if (!JWKS_URI) throw new Error("JWKS_URI is not set");
if (!KEYCLOAK_ISSUER) throw new Error("KEYCLOAK_ISSUER is not set");

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

// 2. Middleware Express
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // A. Lấy Header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "You're not logged in!" });
    return;
  }

  // B. Lấy Token
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "You're not logged in!" });
    return;
  }

  try {
    // C. Xác minh Token
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

    // D. Gán user vào Request để dùng ở các route sau
    (req as any).user = decoded;

    // Chạy tiếp
    next();
  } catch (error) {
    console.error("JWT Error:", (error as Error).message);
    res.status(401).json({ message: "You're not logged in!" });
    return;
  }
};
