import mongoose from "mongoose";
import { isDateString } from "../utils/date.js";

const sleepEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 1440
    },
    quality: {
      type: String,
      required: true,
      enum: ["poor", "fair", "good", "excellent"],
      default: "good"
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

sleepEntrySchema.index({ userId: 1, date: 1 });

const SleepEntry =
  mongoose.models.SleepEntry || mongoose.model("SleepEntry", sleepEntrySchema);

export default SleepEntry;
