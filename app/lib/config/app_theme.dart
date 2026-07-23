import 'package:flutter/material.dart';

class AppTheme {
  // Shared MacroVanta brand tokens. Feature code should consume these tokens
  // or the active ColorScheme instead of introducing page-specific colors.
  static const background = Color(0xFF090D18);
  static const navbar = Color(0xFF101626);
  static const card = Color(0xFF151C2E);
  static const border = Color(0xFF26324A);
  static const primary = Color(0xFF6366F1);
  static const primaryHover = Color(0xFF818CF8);
  static const aiAccent = Color(0xFF22D3EE);
  static const primaryText = Color(0xFFF8FAFC);
  static const mutedText = Color(0xFF94A3B8);
  static const success = Color(0xFF4ADE80);

  static const _lightBackground = Color(0xFFF7F8FC);
  static const _lightNavbar = Color(0xFFFFFFFF);
  static const _lightCard = Color(0xFFFFFFFF);
  static const _lightBorder = Color(0xFFD7DCEF);
  static const _lightText = Color(0xFF111827);
  static const _lightMuted = Color(0xFF64748B);
  static const _darkPrimaryContainer = Color(0xFF252956);
  static const _lightPrimaryContainer = Color(0xFFE8E9FF);
  static const _errorDark = Color(0xFFF87171);
  static const _errorLight = Color(0xFFB42318);

  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static Color aiSoft(Brightness brightness) => brightness == Brightness.dark
      ? aiAccent.withValues(alpha: 0.12)
      : const Color(0xFFD9F8FC);

  static Color aiForeground(Brightness brightness) =>
      brightness == Brightness.dark ? const Color(0xFF67E8F9) : const Color(0xFF0E7490);

  static ThemeData _build(Brightness brightness) {
    final darkMode = brightness == Brightness.dark;
    final base = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
    );
    final scheme = base.copyWith(
      primary: primary,
      onPrimary: Colors.white,
      primaryContainer:
          darkMode ? _darkPrimaryContainer : _lightPrimaryContainer,
      onPrimaryContainer:
          darkMode ? const Color(0xFFC7D2FE) : const Color(0xFF312E81),
      secondary: darkMode ? primaryHover : const Color(0xFF4F46E5),
      onSecondary: Colors.white,
      tertiary: aiAccent,
      onTertiary: const Color(0xFF083344),
      error: darkMode ? _errorDark : _errorLight,
      onError: Colors.white,
      surface: darkMode ? card : _lightCard,
      onSurface: darkMode ? primaryText : _lightText,
      onSurfaceVariant: darkMode ? mutedText : _lightMuted,
      surfaceContainerLowest: darkMode ? navbar : _lightNavbar,
      surfaceContainerLow: darkMode ? navbar : _lightBackground,
      surfaceContainer: darkMode ? card : _lightCard,
      surfaceContainerHigh:
          darkMode ? const Color(0xFF1B2438) : const Color(0xFFF0F2FA),
      surfaceContainerHighest:
          darkMode ? const Color(0xFF202A40) : const Color(0xFFE8EBF5),
      outline: darkMode ? border : _lightBorder,
      outlineVariant: darkMode ? border : _lightBorder,
    );
    final scaffold = darkMode ? background : _lightBackground;
    final navSurface = darkMode ? navbar : _lightNavbar;

    return ThemeData(
      colorScheme: scheme,
      brightness: brightness,
      useMaterial3: true,
      scaffoldBackgroundColor: scaffold,
      canvasColor: scaffold,
      focusColor: primaryHover.withValues(alpha: 0.22),
      hoverColor: primaryHover.withValues(alpha: 0.10),
      splashColor: primaryHover.withValues(alpha: 0.14),
      textSelectionTheme: TextSelectionThemeData(
        cursorColor: primaryHover,
        selectionColor: primaryHover.withValues(alpha: 0.30),
        selectionHandleColor: primary,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: navSurface,
        labelStyle: TextStyle(color: scheme.onSurfaceVariant),
        floatingLabelStyle: const TextStyle(color: primaryHover),
        hintStyle: TextStyle(color: scheme.onSurfaceVariant),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outline),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: primaryHover, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.error, width: 2),
        ),
      ),
      cardTheme: CardThemeData(
        margin: EdgeInsets.zero,
        elevation: 0,
        color: darkMode ? card : _lightCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: scheme.outline),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: navSurface,
        indicatorColor: primary.withValues(alpha: darkMode ? 0.24 : 0.14),
        elevation: 0,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        iconTheme: WidgetStateProperty.resolveWith((states) {
          return IconThemeData(
            color: states.contains(WidgetState.selected)
                ? primaryHover
                : scheme.onSurfaceVariant,
          );
        }),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          return TextStyle(
            color: states.contains(WidgetState.selected)
                ? primaryHover
                : scheme.onSurfaceVariant,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
            // Six tabs leave each label a narrow slot; the default labelMedium
            // (12sp, letterSpacing 0.5) makes "Dashboard" wrap its last letter.
            // Tighten so every label stays on one line.
            fontSize: 11.5,
            letterSpacing: 0,
            height: 1.0,
          );
        }),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: scheme.surfaceContainerHighest,
          disabledForegroundColor: scheme.onSurfaceVariant,
          minimumSize: const Size(44, 50),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryHover,
          side: const BorderSide(color: primary),
          minimumSize: const Size(44, 48),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primaryHover),
      ),
      dividerTheme: DividerThemeData(color: scheme.outlineVariant),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: primary,
        linearTrackColor: scheme.surfaceContainerHighest,
        circularTrackColor: scheme.surfaceContainerHighest,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor:
            darkMode ? const Color(0xFF202A40) : const Color(0xFF1E293B),
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: navSurface,
        foregroundColor: scheme.onSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
    );
  }
}
