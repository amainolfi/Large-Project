import express from "express";
import { logFoodWithAi } from "../controllers/aiFoodController.js";
import {
  createFood,
  deleteFood,
  getFoodById,
  getFoods,
  getRecentFoods,
  quickAddFood,
  searchFoods,
  updateFood
} from "../controllers/foodController.js";
import { protect } from "../middleware/authMiddleware.js";
import { aiRateLimit } from "../middleware/aiRateLimit.js";

const router = express.Router();

router.use(protect);

router.post("/", createFood);
router.get("/", getFoods);
router.post("/ai-log", aiRateLimit, logFoodWithAi);
router.get("/search", searchFoods);
router.get("/recent", getRecentFoods);
router.post("/quick-add/:id", quickAddFood);
router.get("/:id", getFoodById);
router.put("/:id", updateFood);
router.delete("/:id", deleteFood);

export default router;
