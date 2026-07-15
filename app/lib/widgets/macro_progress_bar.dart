import 'package:flutter/material.dart';

/// A single macro progress row, matching the mockups:
///   Label ............................. 41.4%
///   [======green fill========--------------]
///   910 kcal / 2200 kcal
///
/// [percent] is 0..100 (from the summary's progress values). The fill is
/// clamped to 100% width, but the text can show the true percentage.
class MacroProgressBar extends StatelessWidget {
  final String label;
  final double value;
  final double goal;
  final double percent;
  final String unit;

  const MacroProgressBar({
    super.key,
    required this.label,
    required this.value,
    required this.goal,
    required this.percent,
    required this.unit,
  });

  String _fmt(double n) {
    // Show integers without a trailing .0, keep one decimal otherwise.
    if (n == n.roundToDouble()) return n.toInt().toString();
    return n.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    final fillFraction = (percent / 100).clamp(0.0, 1.0);
    const green = Color(0xFF34C759);
    final trackColor = Colors.white.withOpacity(0.08);
    final subTextColor = Colors.white.withOpacity(0.55);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              Text(
                '${_fmt(percent)}%',
                style: TextStyle(fontSize: 15, color: subTextColor),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: fillFraction,
              minHeight: 8,
              backgroundColor: trackColor,
              valueColor: const AlwaysStoppedAnimation(green),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text(
                '${_fmt(value)} $unit',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              Text(
                ' / ${_fmt(goal)} $unit',
                style: TextStyle(fontSize: 15, color: subTextColor),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
