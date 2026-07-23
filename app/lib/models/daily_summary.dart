class NutrientSet {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;
  final double saturatedFat;
  final double transFat;
  final double sugar;
  final double fiber;
  final double sodium;
  final double potassium;
  final double calcium;
  final double iron;
  final double vitaminC;
  final double vitaminD;

  const NutrientSet({
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.saturatedFat,
    required this.transFat,
    required this.sugar,
    required this.fiber,
    required this.sodium,
    required this.potassium,
    required this.calcium,
    required this.iron,
    required this.vitaminC,
    required this.vitaminD,
  });

  factory NutrientSet.fromJson(Map<String, dynamic> json) {
    double number(dynamic value) => (value as num?)?.toDouble() ?? 0.0;

    return NutrientSet(
      calories: number(json['calories']),
      protein: number(json['protein']),
      carbs: number(json['carbs']),
      fat: number(json['fat']),
      saturatedFat: number(json['saturatedFat']),
      transFat: number(json['transFat']),
      sugar: number(json['sugar']),
      fiber: number(json['fiber']),
      sodium: number(json['sodium']),
      potassium: number(json['potassium']),
      calcium: number(json['calcium']),
      iron: number(json['iron']),
      vitaminC: number(json['vitaminC']),
      vitaminD: number(json['vitaminD']),
    );
  }
}

class DailySummary {
  final String date;
  final NutrientSet totals;
  final NutrientSet goals;
  final NutrientSet progress;

  const DailySummary({
    required this.date,
    required this.totals,
    required this.goals,
    required this.progress,
  });

  factory DailySummary.fromJson(Map<String, dynamic> json) {
    return DailySummary(
      date: json['date'] as String? ?? '',
      totals: NutrientSet.fromJson(
          (json['totals'] as Map?)?.cast<String, dynamic>() ?? {}),
      goals: NutrientSet.fromJson(
          (json['goals'] as Map?)?.cast<String, dynamic>() ?? {}),
      progress: NutrientSet.fromJson(
          (json['progress'] as Map?)?.cast<String, dynamic>() ?? {}),
    );
  }
}
