import express from "express";
import {
  getDailySummary,
  getSummaryByMeal,
  getWeeklySummary
} from "../controllers/summaryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/daily", getDailySummary);
router.get("/by-meal", getSummaryByMeal);
router.get("/weekly", getWeeklySummary);

export default router;
