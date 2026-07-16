import 'package:flutter/foundation.dart';

import '../models/food_entry.dart';
import '../services/api_service.dart';

/// Handles the Add/Edit Food screen's data: submitting new or edited entries
/// and loading the recent-foods list for quick add.
///
/// After a successful save, callers should refresh the DashboardProvider so
/// the new entry and updated totals appear.
class FoodEntryProvider extends ChangeNotifier {
  final ApiService _api;

  FoodEntryProvider({ApiService? api}) : _api = api ?? ApiService();

  List<FoodEntry> _recent = [];
  bool _loadingRecent = false;
  bool _submitting = false;
  String? _error;

  List<FoodEntry> get recent => _recent;
  bool get loadingRecent => _loadingRecent;
  bool get submitting => _submitting;
  String? get error => _error;

  Future<void> loadRecent() async {
    _loadingRecent = true;
    notifyListeners();
    try {
      _recent = await _api.getRecentFoods();
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loadingRecent = false;
      notifyListeners();
    }
  }

  /// Create a new entry. Returns true on success.
  Future<bool> create(FoodEntryInput input) async {
    return _run(() => _api.createFood(input));
  }

  /// Update an existing entry. Returns true on success.
  Future<bool> update(String id, FoodEntryInput input) async {
    return _run(() => _api.updateFood(id, input));
  }

  /// Re-log a recent food for [date]. Returns true on success.
  Future<bool> quickAdd(String id, String date) async {
    return _run(() => _api.quickAddFood(id, date));
  }

  /// Converts a consumed-food description into validated estimated entries.
  /// Returns the saved entry count, or null on failure.
  Future<int?> logWithAi({
    required String text,
    required String date,
    required MealType mealType,
  }) async {
    _submitting = true;
    _error = null;
    notifyListeners();
    try {
      final entries = await _api.logFoodWithAi(
        text: text,
        date: date,
        mealType: mealType,
      );
      _submitting = false;
      notifyListeners();
      return entries.length;
    } on ApiException catch (e) {
      _error = e.message;
      _submitting = false;
      notifyListeners();
      return null;
    }
  }

  Future<bool> _run(Future<FoodEntry> Function() action) async {
    _submitting = true;
    _error = null;
    notifyListeners();
    try {
      await action();
      _submitting = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _submitting = false;
      notifyListeners();
      return false;
    }
  }
}
