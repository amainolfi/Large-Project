/// Mirrors the DEPLOYED backend's goal shape.
/// { id, dailyCalories, dailyProtein, dailyCarbs, dailyFat }
class MacroGoal {
  final String id;
  final double dailyCalories;
  final double dailyProtein;
  final double dailyCarbs;
  final double dailyFat;

  const MacroGoal({
    required this.id,
    required this.dailyCalories,
    required this.dailyProtein,
    required this.dailyCarbs,
    required this.dailyFat,
  });

  factory MacroGoal.fromJson(Map<String, dynamic> json) {
    double num2(dynamic v) => (v as num?)?.toDouble() ?? 0.0;

    return MacroGoal(
      id: json['id'] as String? ?? '',
      dailyCalories: num2(json['dailyCalories']),
      dailyProtein: num2(json['dailyProtein']),
      dailyCarbs: num2(json['dailyCarbs']),
      dailyFat: num2(json['dailyFat']),
    );
  }
}

/// Payload for PUT /api/goals (creates or updates the user's goals).
class MacroGoalInput {
  final double dailyCalories;
  final double dailyProtein;
  final double dailyCarbs;
  final double dailyFat;

  const MacroGoalInput({
    required this.dailyCalories,
    required this.dailyProtein,
    required this.dailyCarbs,
    required this.dailyFat,
  });

  Map<String, dynamic> toJson() {
    return {
      'dailyCalories': dailyCalories,
      'dailyProtein': dailyProtein,
      'dailyCarbs': dailyCarbs,
      'dailyFat': dailyFat,
    };
  }
}
