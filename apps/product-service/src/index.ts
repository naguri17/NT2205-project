import express, { Request, Response } from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import productRouter from "./routes/product.route.js";
import categoryRouter from "./routes/category.route.js";
import { consumer, producer } from "./utils/kafka.js";

const app = express();

app.use(express.json());

// CORS Configuration - supports both local and production
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://app.lapisweb.online",
  "https://admin.lapisweb.online",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.get("/test", authMiddleware, (req, res) => {
  res.json({
    message: "Product service authenticated",
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timeStamp: Date.now(),
  });
});

app.use("/products", productRouter);
app.use("/categories", categoryRouter);

app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Internal Server Error" });
});

const connectKafka = async () => {
  try {
    await Promise.all([producer.connect(), consumer.connect()]);
    console.log("Kafka connected successfully");
    return true;
  } catch (error) {
    console.warn("Kafka connection failed, running without Kafka:", error);
    return false;
  }
};

const start = async () => {
  // Start HTTP server first (for health checks)
  app.listen(8000, () => {
    console.log("Product service is running on 8000");
  });

  // Try to connect to Kafka (non-blocking)
  await connectKafka();
};

start();
