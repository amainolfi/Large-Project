/// Mirrors the deployed backend's goal shape.
/// { id, dailyCalories, dailyProtein, dailyCarbs, dailySaturatedFat,
///   dailyTransFat, dailySodium }
class MacroGoal {
  final String id;
  final double dailyCalories;
  final double dailyProtein;
  final double dailyCarbs;
  final double dailySaturatedFat;
  final double dailyTransFat;
  final double dailySodium;

  const MacroGoal({
    required this.id,
    required this.dailyCalories,
    required this.dailyProtein,
    required this.dailyCarbs,
    required this.dailySaturatedFat,
    required this.dailyTransFat,
    required this.dailySodium,
  });

  factory MacroGoal.fromJson(Map<String, dynamic> json) {
    double num2(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

    return MacroGoal(
      id: json['id'] as String? ?? '',
      dailyCalories: num2(json['dailyCalories']),
      dailyProtein: num2(json['dailyProtein']),
      dailyCarbs: num2(json['dailyCarbs']),
      dailySaturatedFat: num2(json['dailySaturatedFat']),
      dailyTransFat: num2(json['dailyTransFat']),
      dailySodium: num2(json['dailySodium']),
    );
  }
}

/// Payload for PUT /api/goals (creates or updates the user's goals).
class MacroGoalInput {
  final double dailyCalories;
  final double dailyProtein;
  final double dailyCarbs;
  final double dailySaturatedFat;
  final double dailyTransFat;
  final double dailySodium;

  const MacroGoalInput({
    required this.dailyCalories,
    required this.dailyProtein,
    required this.dailyCarbs,
    required this.dailySaturatedFat,
    required this.dailyTransFat,
    required this.dailySodium,
  });

  Map<String, dynamic> toJson() {
    return {
      'dailyCalories': dailyCalories,
      'dailyProtein': dailyProtein,
      'dailyCarbs': dailyCarbs,
      'dailySaturatedFat': dailySaturatedFat,
      'dailyTransFat': dailyTransFat,
      'dailySodium': dailySodium,
    };
  }
}
