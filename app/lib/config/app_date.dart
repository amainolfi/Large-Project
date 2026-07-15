import 'package:intl/intl.dart';

/// The API uses plain "YYYY-MM-DD" strings for the `date` field everywhere.
/// These helpers keep that format consistent and provide friendly display text.
class AppDate {
  static final DateFormat _api = DateFormat('yyyy-MM-dd');
  static final DateFormat _display = DateFormat('EEEE, MMMM d, y');

  /// "2026-07-10" for a given DateTime (local date, no time component).
  static String toApi(DateTime d) => _api.format(d);

  /// Today's date as an API string.
  static String today() => toApi(DateTime.now());

  /// Parse an API string back into a DateTime (midnight local).
  static DateTime parse(String apiDate) => _api.parse(apiDate);

  /// "Friday, July 10, 2026" for the header.
  static String display(String apiDate) => _display.format(parse(apiDate));

  /// Shift an API date string by [days] and return a new API string.
  static String shift(String apiDate, int days) =>
      toApi(parse(apiDate).add(Duration(days: days)));

  static bool isToday(String apiDate) => apiDate == today();
}
