import { Context, Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import stripe from "../utils/stripe.js";

const sessionRoute = new Hono();

sessionRoute.post(
  "/create-checkout-session",
  authMiddleware,
  async (c: Context) => {
    try {
      const user = c.get("user");
      const body = await c.req.json();
      const { products, shippingForm } = body;

      const line_items = products.map((product: any) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            images: product.image ? [product.image] : [],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: product.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        ui_mode: "custom",
        line_items: line_items,
        client_reference_id: user.sub,
        mode: "payment",

        return_url: `${process.env.CLIENT_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
      });

      // 3. Trả về clientSecret cho Frontend
      return c.json({ checkoutSessionClientSecret: session.client_secret });
    } catch (error) {
      console.error("Error creating session:", error);
      return c.json({ error: "Failed to create session" }, 500);
    }
  },
);

sessionRoute.get("/:session_id", async (c) => {
  const { session_id } = c.req.param();
  const session = await stripe.checkout.sessions.retrieve(
    session_id as string,
    {
      expand: ["line_items"],
    },
  );

  return c.json({
    status: session.status,
    paymentStatus: session.payment_status,
  });
});

export default sessionRoute;
