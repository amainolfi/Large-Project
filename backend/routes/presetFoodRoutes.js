import express from "express";
import { searchPresetFoods } from "../controllers/presetFoodController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/search", searchPresetFoods);

export default router;
