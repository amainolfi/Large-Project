import mongoose from "mongoose";

const macroGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    dailyCalories: {
      type: Number,
      required: true,
      min: 0
    },
    dailyProtein: {
      type: Number,
      required: true,
      min: 0
    },
    dailyCarbs: {
      type: Number,
      required: true,
      min: 0
    },
    dailySaturatedFat: {
      type: Number,
      required: true,
      min: 0
    },
    dailyTransFat: {
      type: Number,
      required: true,
      min: 0
    },
    dailySodium: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

const MacroGoal =
  mongoose.models.MacroGoal || mongoose.model("MacroGoal", macroGoalSchema);

export default MacroGoal;
