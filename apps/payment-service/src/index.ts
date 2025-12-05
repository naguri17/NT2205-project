import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { uptime } from "process";
import { authMiddleware } from "./middleware/auth.js";
import { Variables } from "./types/hono.js";
import stripe from "./utils/stripe.js";

const app = new Hono<{ Variables: Variables }>();

app.get("/test", authMiddleware, (c) => {
  // Lấy thông tin user đã giải mã từ Context (được set trong middleware)
  const user = c.get("user");

  return c.json({
    message: "Payment service authenticated",
  });
});

// app.post("/create-stripe-product", async (c) => {
//   const res = await stripe.products.create({
//     id: "123",
//     name: "Test Product",
//     default_price_data: {
//       currency: "usd",
//       unit_amount: 10 * 100,
//     },
//   });

//   return c.json(res);
// });

// app.get("/stripe-product-price", async (c) => {
//   const res = await stripe.prices.list({
//     product: "123",
//   });

//   return c.json(res);
// });

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
