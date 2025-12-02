import express, { Request, Response } from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
  })
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

app.listen(8000, () => {
  console.log("Product service is running on port 8000");
});
