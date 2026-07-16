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
      default: 0,
      min: 0
    },
    saturatedFat: {
      type: Number,
      required: true,
      min: 0
    },
    transFat: {
      type: Number,
      required: true,
      min: 0
    },
    fiber: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    sodium: {
      type: Number,
      required: true,
      min: 0
    },
    potassium: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    calcium: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    iron: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    vitaminC: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    vitaminD: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    source: {
      type: String,
      enum: ["manual", "ai", "usda"],
      default: "manual"
    },
    confidence: {
      type: String,
      enum: ["low", "medium", "high"],
      default: undefined
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
