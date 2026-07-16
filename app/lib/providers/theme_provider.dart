import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ThemeProvider extends ChangeNotifier {
  static const _storageKey = 'mv_theme';
  final FlutterSecureStorage _storage;

  ThemeMode _themeMode = ThemeMode.dark;

  ThemeProvider({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage();

  ThemeMode get themeMode => _themeMode;
  bool get isDark => _themeMode == ThemeMode.dark;

  Future<void> load() async {
    final saved = await _storage.read(key: _storageKey);
    _themeMode = saved == 'light' ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }

  Future<void> toggle() async {
    _themeMode = isDark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
    await _storage.write(
      key: _storageKey,
      value: isDark ? 'dark' : 'light',
    );
  }
}
