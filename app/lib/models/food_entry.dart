/// The four allowed meal types. The backend enforces these exact strings
/// (enum on the FoodEntry schema), so treat them as authoritative.
enum MealType {
  breakfast('Breakfast'),
  lunch('Lunch'),
  dinner('Dinner'),
  snack('Snack');

  final String label;
  const MealType(this.label);

  static MealType fromLabel(String value) {
    return MealType.values.firstWhere(
      (m) => m.label == value,
      orElse: () => MealType.breakfast,
    );
  }
}

/// Mirrors the DEPLOYED backend's food entry shape:
/// { id, foodName, servingSize, mealType, calories, protein, carbs, fat,
///   date, createdAt, updatedAt }
///
/// NOTE: The deployed server currently tracks a single `fat` field (no
/// saturated/trans split, no sodium). The newer six-nutrient version exists
/// in the repo but isn't deployed yet; when it is, this model expands again.
class FoodEntry {
  final String id;
  final String foodName;
  final String servingSize;
  final MealType mealType;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final String date; // "YYYY-MM-DD"
  final String? createdAt;
  final String? updatedAt;

  const FoodEntry({
    required this.id,
    required this.foodName,
    required this.servingSize,
    required this.mealType,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.date,
    this.createdAt,
    this.updatedAt,
  });

  factory FoodEntry.fromJson(Map<String, dynamic> json) {
    double num2(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

    return FoodEntry(
      id: json['id'] as String,
      foodName: json['foodName'] as String? ?? '',
      servingSize: json['servingSize'] as String? ?? '',
      mealType: MealType.fromLabel(json['mealType'] as String? ?? 'Breakfast'),
      calories: num2(json['calories']),
      protein: num2(json['protein']),
      carbs: num2(json['carbs']),
      fat: num2(json['fat']),
      date: json['date'] as String? ?? '',
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}

/// Payload for creating/updating a food entry.
/// Matches what POST /api/foods and PUT /api/foods/:id expect on the live server.
class FoodEntryInput {
  final String foodName;
  final String servingSize;
  final MealType mealType;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final String date; // "YYYY-MM-DD"

  const FoodEntryInput({
    required this.foodName,
    required this.servingSize,
    required this.mealType,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.date,
  });

  Map<String, dynamic> toJson() {
    return {
      'foodName': foodName,
      'servingSize': servingSize,
      'mealType': mealType.label,
      'calories': calories,
      'protein': protein,
      'carbs': carbs,
      'fat': fat,
      'date': date,
    };
  }
}
