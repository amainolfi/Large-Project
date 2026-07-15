import 'daily_summary.dart';

/// One day's totals within a weekly summary.
/// Shape: { date, totals: { calories, protein, carbs, fat } }
class DayTotals {
  final String date;
  final NutrientSet totals;

  const DayTotals({required this.date, required this.totals});

  factory DayTotals.fromJson(Map<String, dynamic> json) {
    return DayTotals(
      date: json['date'] as String? ?? '',
      totals: NutrientSet.fromJson(
          (json['totals'] as Map?)?.cast<String, dynamic>() ?? {}),
    );
  }
}

/// Mirrors GET /api/summary/weekly:
/// { startDate, endDate, days: [ { date, totals } x7 ] }
class WeeklySummary {
  final String startDate;
  final String endDate;
  final List<DayTotals> days;

  const WeeklySummary({
    required this.startDate,
    required this.endDate,
    required this.days,
  });

  factory WeeklySummary.fromJson(Map<String, dynamic> json) {
    final rawDays = (json['days'] as List?) ?? [];
    return WeeklySummary(
      startDate: json['startDate'] as String? ?? '',
      endDate: json['endDate'] as String? ?? '',
      days: rawDays
          .cast<Map<String, dynamic>>()
          .map(DayTotals.fromJson)
          .toList(),
    );
  }
}
