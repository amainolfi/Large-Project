enum MealType {
  breakfast('Breakfast'),
  lunch('Lunch'),
  dinner('Dinner'),
  snack('Snack');

  final String label;
  const MealType(this.label);

  static MealType fromLabel(String value) {
    return MealType.values.firstWhere(
      (meal) => meal.label == value,
      orElse: () => MealType.breakfast,
    );
  }
}

enum FoodSource {
  manual('manual'),
  ai('ai'),
  usda('usda');

  final String value;
  const FoodSource(this.value);

  static FoodSource fromValue(String? value) {
    return FoodSource.values.firstWhere(
      (source) => source.value == value,
      orElse: () => FoodSource.manual,
    );
  }
}

class FoodEntry {
  final String id;
  final String foodName;
  final String servingSize;
  final MealType mealType;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double saturatedFat;
  final double transFat;
  final double fiber;
  final double sodium;
  final double potassium;
  final double calcium;
  final double iron;
  final double vitaminC;
  final double vitaminD;
  final FoodSource source;
  final String? confidence;
  final String date;
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
    required this.saturatedFat,
    required this.transFat,
    required this.fiber,
    required this.sodium,
    required this.potassium,
    required this.calcium,
    required this.iron,
    required this.vitaminC,
    required this.vitaminD,
    required this.source,
    required this.date,
    this.confidence,
    this.createdAt,
    this.updatedAt,
  });

  factory FoodEntry.fromJson(Map<String, dynamic> json) {
    double number(dynamic value) => (value as num?)?.toDouble() ?? 0.0;

    return FoodEntry(
      id: json['id'] as String? ?? '',
      foodName: json['foodName'] as String? ?? '',
      servingSize: json['servingSize'] as String? ?? '',
      mealType: MealType.fromLabel(json['mealType'] as String? ?? 'Breakfast'),
      calories: number(json['calories']),
      protein: number(json['protein']),
      carbs: number(json['carbs']),
      fat: number(json['fat']),
      saturatedFat: number(json['saturatedFat']),
      transFat: number(json['transFat']),
      fiber: number(json['fiber']),
      sodium: number(json['sodium']),
      potassium: number(json['potassium']),
      calcium: number(json['calcium']),
      iron: number(json['iron']),
      vitaminC: number(json['vitaminC']),
      vitaminD: number(json['vitaminD']),
      source: FoodSource.fromValue(json['source'] as String?),
      confidence: json['confidence'] as String?,
      date: json['date'] as String? ?? '',
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }
}

class FoodEntryInput {
  final String foodName;
  final String servingSize;
  final MealType mealType;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double saturatedFat;
  final double transFat;
  final double fiber;
  final double sodium;
  final double potassium;
  final double calcium;
  final double iron;
  final double vitaminC;
  final double vitaminD;
  final FoodSource source;
  final String date;

  const FoodEntryInput({
    required this.foodName,
    required this.servingSize,
    required this.mealType,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    this.saturatedFat = 0,
    this.transFat = 0,
    this.fiber = 0,
    this.sodium = 0,
    this.potassium = 0,
    this.calcium = 0,
    this.iron = 0,
    this.vitaminC = 0,
    this.vitaminD = 0,
    this.source = FoodSource.manual,
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
      'saturatedFat': saturatedFat,
      'transFat': transFat,
      'fiber': fiber,
      'sodium': sodium,
      'potassium': potassium,
      'calcium': calcium,
      'iron': iron,
      'vitaminC': vitaminC,
      'vitaminD': vitaminD,
      'source': source.value,
      'date': date,
    };
  }
}

/// A verified serving returned by the server-side USDA FoodData Central
/// search. The API keeps the USDA key and quota controls off the device.
class PresetFood {
  final int fdcId;
  final String foodName;
  final String? brand;
  final String dataType;
  final String servingSize;
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double saturatedFat;
  final double transFat;
  final double fiber;
  final double sodium;
  final double potassium;
  final double calcium;
  final double iron;
  final double vitaminC;
  final double vitaminD;

  const PresetFood({
    required this.fdcId,
    required this.foodName,
    required this.brand,
    required this.dataType,
    required this.servingSize,
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.saturatedFat,
    required this.transFat,
    required this.fiber,
    required this.sodium,
    required this.potassium,
    required this.calcium,
    required this.iron,
    required this.vitaminC,
    required this.vitaminD,
  });

  factory PresetFood.fromJson(Map<String, dynamic> json) {
    double number(dynamic value) => (value as num?)?.toDouble() ?? 0.0;
    final rawId = json['fdcId'];

    return PresetFood(
      fdcId: rawId is num ? rawId.toInt() : int.tryParse('$rawId') ?? 0,
      foodName: json['foodName'] as String? ?? '',
      brand: json['brand'] as String?,
      dataType: json['dataType'] as String? ?? '',
      servingSize: json['servingSize'] as String? ?? '100 g',
      calories: number(json['calories']),
      protein: number(json['protein']),
      carbs: number(json['carbs']),
      fat: number(json['fat']),
      saturatedFat: number(json['saturatedFat']),
      transFat: number(json['transFat']),
      fiber: number(json['fiber']),
      sodium: number(json['sodium']),
      potassium: number(json['potassium']),
      calcium: number(json['calcium']),
      iron: number(json['iron']),
      vitaminC: number(json['vitaminC']),
      vitaminD: number(json['vitaminD']),
    );
  }

  FoodEntryInput toFoodEntryInput({
    required MealType mealType,
    required String date,
  }) {
    return FoodEntryInput(
      foodName: foodName,
      servingSize: servingSize,
      mealType: mealType,
      calories: calories,
      protein: protein,
      carbs: carbs,
      fat: fat,
      saturatedFat: saturatedFat,
      transFat: transFat,
      fiber: fiber,
      sodium: sodium,
      potassium: potassium,
      calcium: calcium,
      iron: iron,
      vitaminC: vitaminC,
      vitaminD: vitaminD,
      source: FoodSource.usda,
      date: date,
    );
  }
}
