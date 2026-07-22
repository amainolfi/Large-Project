import 'package:flutter/foundation.dart';

import '../config/app_date.dart';
import '../models/wellness.dart';
import '../services/api_service.dart';

class WellnessProvider extends ChangeNotifier {
  final ApiService _api;

  WellnessProvider({ApiService? api}) : _api = api ?? ApiService();

  String _date = AppDate.today();
  WellnessSummary? _summary;
  List<WaterEntry> _waterEntries = [];
  List<CardioEntry> _cardioEntries = [];
  List<SleepEntry> _sleepEntries = [];
  bool _loading = false;
  bool _submitting = false;
  String? _error;

  String get date => _date;
  WellnessSummary? get summary => _summary;
  List<WaterEntry> get waterEntries => _waterEntries;
  List<CardioEntry> get cardioEntries => _cardioEntries;
  List<SleepEntry> get sleepEntries => _sleepEntries;
  bool get loading => _loading;
  bool get submitting => _submitting;
  String? get error => _error;

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _api.getWellnessSummary(_date),
        _api.getWaterEntries(_date),
        _api.getCardioEntries(_date),
        _api.getSleepEntries(_date),
      ]);
      _summary = results[0] as WellnessSummary;
      _waterEntries = results[1] as List<WaterEntry>;
      _cardioEntries = results[2] as List<CardioEntry>;
      _sleepEntries = results[3] as List<SleepEntry>;
    } on ApiException catch (e) {
      _error = e.message;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> setDate(String date) async {
    _date = date;
    await load();
  }

  Future<bool> addWater(int amountMl) =>
      _mutate(() => _api.createWaterEntry(amountMl, _date));

  Future<bool> addCardio(CardioEntryInput input) =>
      _mutate(() => _api.createCardioEntry(input));

  Future<bool> addSleep(SleepEntryInput input) =>
      _mutate(() => _api.createSleepEntry(input));

  Future<bool> deleteWater(String id) =>
      _mutate(() => _api.deleteWaterEntry(id));

  Future<bool> deleteCardio(String id) =>
      _mutate(() => _api.deleteCardioEntry(id));

  Future<bool> deleteSleep(String id) =>
      _mutate(() => _api.deleteSleepEntry(id));

  Future<bool> saveGoals(WellnessGoal goals) =>
      _mutate(() => _api.saveWellnessGoals(goals));

  Future<bool> _mutate(Future<dynamic> Function() action) async {
    _submitting = true;
    _error = null;
    notifyListeners();
    try {
      await action();
      await load();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      return false;
    } finally {
      _submitting = false;
      notifyListeners();
    }
  }
}
