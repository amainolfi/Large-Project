import express from "express";
import { getGoals, upsertGoals } from "../controllers/goalsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getGoals);
router.put("/", upsertGoals);

export default router;
