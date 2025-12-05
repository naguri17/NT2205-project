import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller.js";
import { adminMiddleware, authMiddleware } from "../middleware/auth.js";

const router: Router = Router();

router.post("/", authMiddleware, adminMiddleware, createCategory);

router.put("/:id", authMiddleware, adminMiddleware, updateCategory);

router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

router.get("/", getCategories);

export default router;
