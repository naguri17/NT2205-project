import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { uptime } from "process";

const app = new Hono();

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
