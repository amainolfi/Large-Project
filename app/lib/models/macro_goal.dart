class MacroGoal {
  final String id;
  final double dailyCalories;
  final double dailyProtein;
  final double dailyCarbs;
  final double dailyFat;
  final double dailySaturatedFat;
  final double dailyTransFat;
  final double dailySugar;
  final double dailyFiber;
  final double dailySodium;
  final double dailyPotassium;
  final double dailyCalcium;
  final double dailyIron;
  final double dailyVitaminC;
  final double dailyVitaminD;

  const MacroGoal({
    required this.id,
    required this.dailyCalories,
    required this.dailyProtein,
    required this.dailyCarbs,
    required this.dailyFat,
    required this.dailySaturatedFat,
    required this.dailyTransFat,
    required this.dailySugar,
    required this.dailyFiber,
    required this.dailySodium,
    required this.dailyPotassium,
    required this.dailyCalcium,
    required this.dailyIron,
    required this.dailyVitaminC,
    required this.dailyVitaminD,
  });

  factory MacroGoal.fromJson(Map<String, dynamic> json) {
    double number(dynamic value) => (value as num?)?.toDouble() ?? 0.0;

    return MacroGoal(
      id: json['id'] as String? ?? '',
      dailyCalories: number(json['dailyCalories']),
      dailyProtein: number(json['dailyProtein']),
      dailyCarbs: number(json['dailyCarbs']),
      dailyFat: number(json['dailyFat']),
      dailySaturatedFat: number(json['dailySaturatedFat']),
      dailyTransFat: number(json['dailyTransFat']),
      dailySugar: number(json['dailySugar']),
      dailyFiber: number(json['dailyFiber']),
      dailySodium: number(json['dailySodium']),
      dailyPotassium: number(json['dailyPotassium']),
      dailyCalcium: number(json['dailyCalcium']),
      dailyIron: number(json['dailyIron']),
      dailyVitaminC: number(json['dailyVitaminC']),
      dailyVitaminD: number(json['dailyVitaminD']),
    );
  }
}

class MacroGoalInput {
  final double dailyCalories;
  final double dailyProtein;
  final double dailyCarbs;
  final double dailyFat;
  final double dailySaturatedFat;
  final double dailyTransFat;
  final double dailySugar;
  final double dailyFiber;
  final double dailySodium;
  final double dailyPotassium;
  final double dailyCalcium;
  final double dailyIron;
  final double dailyVitaminC;
  final double dailyVitaminD;

  const MacroGoalInput({
    required this.dailyCalories,
    required this.dailyProtein,
    required this.dailyCarbs,
    required this.dailyFat,
    required this.dailySaturatedFat,
    required this.dailyTransFat,
    required this.dailySugar,
    required this.dailyFiber,
    required this.dailySodium,
    required this.dailyPotassium,
    required this.dailyCalcium,
    required this.dailyIron,
    required this.dailyVitaminC,
    required this.dailyVitaminD,
  });

  Map<String, dynamic> toJson() {
    return {
      'dailyCalories': dailyCalories,
      'dailyProtein': dailyProtein,
      'dailyCarbs': dailyCarbs,
      'dailyFat': dailyFat,
      'dailySaturatedFat': dailySaturatedFat,
      'dailyTransFat': dailyTransFat,
      'dailySugar': dailySugar,
      'dailyFiber': dailyFiber,
      'dailySodium': dailySodium,
      'dailyPotassium': dailyPotassium,
      'dailyCalcium': dailyCalcium,
      'dailyIron': dailyIron,
      'dailyVitaminC': dailyVitaminC,
      'dailyVitaminD': dailyVitaminD,
    };
  }
}
