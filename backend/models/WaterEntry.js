import mongoose from "mongoose";
import { isDateString } from "../utils/date.js";

const waterEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    amountMl: {
      type: Number,
      required: true,
      min: 1,
      max: 5000
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

waterEntrySchema.index({ userId: 1, date: 1 });

const WaterEntry =
  mongoose.models.WaterEntry || mongoose.model("WaterEntry", waterEntrySchema);

export default WaterEntry;
