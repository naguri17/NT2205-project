import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { uptime } from "process";
import { shouldBeUser } from "./middleware/authMiddleware.js";

const app = new Hono();
app.use("*", clerkMiddleware());

app.get("/test", shouldBeUser, (c) => {
  return c.json({
    message: "Payment service authenticated!",
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
