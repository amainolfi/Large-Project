import 'package:flutter/material.dart';

import '../config/app_theme.dart';

class MacroProgressBar extends StatelessWidget {
  final String label;
  final double value;
  final double goal;
  final double percent;
  final String unit;
  final bool isLimit;

  const MacroProgressBar({
    super.key,
    required this.label,
    required this.value,
    required this.goal,
    required this.percent,
    required this.unit,
    this.isLimit = false,
  });

  String _format(double number) => number == number.roundToDouble()
      ? number.toInt().toString()
      : number.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final fillFraction = goal > 0 ? (percent / 100).clamp(0.0, 1.0) : 0.0;
    final fillColor = switch ((isLimit, goal > 0 && percent >= 100)) {
      (true, true) => colors.error,
      (false, true) => AppTheme.errorF,
      _ => colors.primary,
    };

    return Semantics(
      label: '$label, ${_format(value)} $unit of ${_format(goal)} $unit',
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(label,
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w600)),
                  Text(
                    goal > 0 ? '${_format(percent)}%' : '—',
                    style:
                        TextStyle(fontSize: 15, color: colors.onSurfaceVariant),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: fillFraction,
                  minHeight: 8,
                  backgroundColor: colors.surfaceContainerHighest,
                  valueColor: AlwaysStoppedAnimation(fillColor),
                ),
              ),
              const SizedBox(height: 10),
              Text.rich(
                TextSpan(
                  children: [
                    TextSpan(
                      text: '${_format(value)} $unit',
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    TextSpan(
                      text:
                          goal > 0 ? ' / ${_format(goal)} $unit' : ' / no goal',
                      style: TextStyle(color: colors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
