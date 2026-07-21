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

/// Mirrors the deployed backend's food entry shape:
/// { id, foodName, servingSize, mealType, calories, protein, carbs,
///   saturatedFat, transFat, sodium, date, createdAt, updatedAt }
class FoodEntry {
  final String id;
  final String foodName;
  final String servingSize;
  final MealType mealType;
  final double calories;
  final double protein;
  final double carbs;
  final double saturatedFat;
  final double transFat;
  final double sodium;
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
    required this.saturatedFat,
    required this.transFat,
    required this.sodium,
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
      saturatedFat: num2(json['saturatedFat']),
      transFat: num2(json['transFat']),
      sodium: num2(json['sodium']),
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
  final double saturatedFat;
  final double transFat;
  final double sodium;
  final String date; // "YYYY-MM-DD"

  const FoodEntryInput({
    required this.foodName,
    required this.servingSize,
    required this.mealType,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.saturatedFat,
    required this.transFat,
    required this.sodium,
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
      'saturatedFat': saturatedFat,
      'transFat': transFat,
      'sodium': sodium,
      'date': date,
    };
  }
}
