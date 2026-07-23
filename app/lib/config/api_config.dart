/// Central place for API configuration.
///
/// The deployed backend is the source of truth. If you ever need to point at a
/// local server instead, this is the ONLY line you change:
///   - Deployed:            https://dylanwexler.com
///   - Local (Android emu): http://10.0.2.2:5000
///   - Local (real iPhone): http://<your-computer-LAN-IP>:5000
///
/// Note: iOS blocks plain http:// by default (App Transport Security). The
/// deployed https URL needs no exception; a local http URL would.
class ApiConfig {
  static const String baseUrl = 'https://dylanwexler.com';

  /// All backend routes are mounted under /api.
  static const String apiPrefix = '/api';

  /// Full base for API calls, e.g. https://dylanwexler.com/api
  static String get apiBase => '$baseUrl$apiPrefix';
}
