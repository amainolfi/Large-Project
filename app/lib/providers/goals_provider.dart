import 'package:flutter/foundation.dart';

import '../models/macro_goal.dart';
import '../services/api_service.dart';

/// Manages the Goals screen: loads the user's current goals and saves updates.
///
/// getGoals() may return null if the user has never set goals — the screen
/// handles that by starting from blank/zero fields.
class GoalsProvider extends ChangeNotifier {
  final ApiService _api;

  GoalsProvider({ApiService? api}) : _api = api ?? ApiService();

  MacroGoal? _goals;
  bool _loading = false;
  bool _saving = false;
  String? _error;

  MacroGoal? get goals => _goals;
  bool get loading => _loading;
  bool get saving => _saving;
  String? get error => _error;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _goals = await _api.getGoals();
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Save goals. Returns true on success.
  Future<bool> save(MacroGoalInput input) async {
    _saving = true;
    _error = null;
    notifyListeners();
    try {
      _goals = await _api.saveGoals(input);
      _saving = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _saving = false;
      notifyListeners();
      return false;
    }
  }
}
