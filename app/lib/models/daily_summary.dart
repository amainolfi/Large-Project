/// A set of nutrient values, matching the DEPLOYED server's shape.
/// Keys: calories, protein, carbs, fat.
class NutrientSet {
  final double calories;
  final double protein;
  final double carbs;
  final double fat;

  const NutrientSet({
    required this.calories,
    required this.protein,
    required this.carbs,
    required this.fat,
  });

  factory NutrientSet.fromJson(Map<String, dynamic> json) {
    double num2(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

    return NutrientSet(
      calories: num2(json['calories']),
      protein: num2(json['protein']),
      carbs: num2(json['carbs']),
      fat: num2(json['fat']),
    );
  }
}

/// Mirrors GET /api/summary/daily response:
/// { date, totals: {...}, goals: {...}, progress: {...} }
/// where progress values are percentages (e.g. 41.4).
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
