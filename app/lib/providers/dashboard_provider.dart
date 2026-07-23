import 'package:flutter/foundation.dart';

import '../config/app_date.dart';
import '../models/daily_summary.dart';
import '../models/food_entry.dart';
import '../services/api_service.dart';

/// Holds the state for the Dashboard: which date is selected, the daily
/// summary (totals/goals/progress), and that day's food entries.
///
/// The date navigator (Prev / Today / Next) just changes [date] and reloads.
class DashboardProvider extends ChangeNotifier {
  final ApiService _api;

  DashboardProvider({ApiService? api}) : _api = api ?? ApiService();

  String _date = AppDate.today();
  DailySummary? _summary;
  List<FoodEntry> _foods = [];
  bool _loading = false;
  String? _error;

  String get date => _date;
  DailySummary? get summary => _summary;
  List<FoodEntry> get foods => _foods;
  bool get loading => _loading;
  String? get error => _error;
  bool get isToday => AppDate.isToday(_date);

  /// Entries for a given meal, in the order they were logged.
  List<FoodEntry> foodsForMeal(MealType meal) =>
      _foods.where((f) => f.mealType == meal).toList();

  /// Total calories for a meal (used in each meal-section header).
  double caloriesForMeal(MealType meal) =>
      foodsForMeal(meal).fold(0.0, (sum, f) => sum + f.calories);

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      // Fetch summary and foods together for the selected day.
      final results = await Future.wait([
        _api.getDailySummary(_date),
        _api.getFoods(_date),
      ]);
      _summary = results[0] as DailySummary;
      _foods = results[1] as List<FoodEntry>;
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> goPrev() async {
    _date = AppDate.shift(_date, -1);
    await load();
  }

  Future<void> goNext() async {
    _date = AppDate.shift(_date, 1);
    await load();
  }

  Future<void> goToday() async {
    _date = AppDate.today();
    await load();
  }

  /// Remove an entry, then refresh the day so totals/progress update.
  Future<bool> deleteFood(String id) async {
    _error = null;
    try {
      await _api.deleteFood(id);
      await load();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      notifyListeners();
      return false;
    }
  }
}
