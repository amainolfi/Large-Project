import mongoose from "mongoose";

const foodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    servingSize: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    mealType: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"]
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      required: true,
      min: 0
    },
    carbs: {
      type: Number,
      required: true,
      min: 0
    },
    fat: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    }
  },
  {
    timestamps: true
  }
);

foodEntrySchema.index({ userId: 1, date: 1 });
foodEntrySchema.index({ userId: 1, foodName: 1 });

const FoodEntry =
  mongoose.models.FoodEntry || mongoose.model("FoodEntry", foodEntrySchema);

export default FoodEntry;
