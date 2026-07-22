import mongoose from "mongoose";
import { isDateString } from "../utils/date.js";

const cardioEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    activityType: {
      type: String,
      required: true,
      enum: [
        "walking",
        "running",
        "cycling",
        "swimming",
        "elliptical",
        "rowing",
        "sports",
        "other"
      ]
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440
    },
    distanceKm: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 1000
    },
    caloriesBurned: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 10000
    },
    intensity: {
      type: String,
      required: true,
      enum: ["low", "moderate", "high"],
      default: "moderate"
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: isDateString,
        message: "date must be a valid date in YYYY-MM-DD format."
      }
    }
  },
  { timestamps: true }
);

cardioEntrySchema.index({ userId: 1, date: 1 });

const CardioEntry =
  mongoose.models.CardioEntry || mongoose.model("CardioEntry", cardioEntrySchema);

export default CardioEntry;
