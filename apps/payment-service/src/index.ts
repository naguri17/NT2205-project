import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { uptime } from "process";
import { authMiddleware } from "./middleware/auth.js";
import { Variables } from "./types/hono.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/test", authMiddleware, (c) => {
  // Lấy thông tin user đã giải mã từ Context (được set trong middleware)
  const user = c.get("user");

  return c.json({
    message: "Payment service authenticated",
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    uptime: uptime(),
    timeStamp: Date.now(),
  });
});

const start = async () => {
  try {
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
