import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "../controllers/product.controller.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

const router: Router = Router();

router.post("/", authMiddleware, adminMiddleware, createProduct);

router.put("/:id", authMiddleware, adminMiddleware, updateProduct);

router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

router.get("/:id", getProduct);

router.get("/", getProducts);

export default router;
