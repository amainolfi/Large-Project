import express from "express";
import {
  createCardio,
  createSleep,
  createWater,
  deleteCardio,
  deleteSleep,
  deleteWater,
  getWellnessGoals,
  getWellnessSummary,
  listCardio,
  listSleep,
  listWater,
  updateCardio,
  updateSleep,
  updateWater,
  upsertWellnessGoals
} from "../controllers/wellnessController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/summary", getWellnessSummary);
router.get("/goals", getWellnessGoals);
router.put("/goals", upsertWellnessGoals);

router.get("/cardio", listCardio);
router.post("/cardio", createCardio);
router.put("/cardio/:id", updateCardio);
router.delete("/cardio/:id", deleteCardio);

router.get("/water", listWater);
router.post("/water", createWater);
router.put("/water/:id", updateWater);
router.delete("/water/:id", deleteWater);

router.get("/sleep", listSleep);
router.post("/sleep", createSleep);
router.put("/sleep/:id", updateSleep);
router.delete("/sleep/:id", deleteSleep);

export default router;
