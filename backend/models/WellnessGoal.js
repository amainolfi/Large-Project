import mongoose from "mongoose";

const wellnessGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    dailyWaterMl: {
      type: Number,
      required: true,
      default: 2500,
      min: 0,
      max: 20000
    },
    nightlySleepMinutes: {
      type: Number,
      required: true,
      default: 480,
      min: 0,
      max: 1440
    },
    weeklyCardioMinutes: {
      type: Number,
      required: true,
      default: 150,
      min: 0,
      max: 10080
    }
  },
  { timestamps: true }
);

const WellnessGoal =
  mongoose.models.WellnessGoal || mongoose.model("WellnessGoal", wellnessGoalSchema);

export default WellnessGoal;
