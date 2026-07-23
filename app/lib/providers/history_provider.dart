import 'package:flutter/foundation.dart';

import '../config/app_date.dart';
import '../models/macro_goal.dart';
import '../models/weekly_summary.dart';
import '../services/api_service.dart';

/// Manages the History screen. Loads a 7-day window ending on [_endDate]
/// (so the default view is the trailing week, matching the mockup's
/// "Last 7 days"), plus the user's goals so the chart can flag over-goal days.
class HistoryProvider extends ChangeNotifier {
  final ApiService _api;

  HistoryProvider({ApiService? api}) : _api = api ?? ApiService();

  // End date of the visible week; start is 6 days before this.
  String _endDate = AppDate.today();
  WeeklySummary? _summary;
  MacroGoal? _goals;
  bool _loading = false;
  String? _error;

  WeeklySummary? get summary => _summary;
  MacroGoal? get goals => _goals;
  bool get loading => _loading;
  String? get error => _error;
  String get endDate => _endDate;
  String get startDate => AppDate.shift(_endDate, -6);

  bool get isCurrentWeek => _endDate == AppDate.today();

  /// Daily calorie goal, or null if goals unset. Used for the chart threshold.
  double? get calorieGoal => (_goals != null && _goals!.dailyCalories > 0)
      ? _goals!.dailyCalories
      : null;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _api.getWeeklySummary(startDate),
        _api.getGoals(),
      ]);
      _summary = results[0] as WeeklySummary;
      _goals = results[1] as MacroGoal?;
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> prevWeek() async {
    _endDate = AppDate.shift(_endDate, -7);
    await load();
  }

  Future<void> nextWeek() async {
    _endDate = AppDate.shift(_endDate, 7);
    await load();
  }

  Future<void> lastSevenDays() async {
    _endDate = AppDate.today();
    await load();
  }
}
