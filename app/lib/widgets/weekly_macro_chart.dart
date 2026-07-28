import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../config/app_date.dart';
import '../models/daily_summary.dart';
import '../models/macro_goal.dart';
import '../models/weekly_summary.dart';

enum _MacroChartMode { calorieShare, grams }

enum _MacroKind { protein, carbs, fat }

extension on _MacroKind {
  String get label => switch (this) {
        _MacroKind.protein => 'Protein',
        _MacroKind.carbs => 'Carbohydrates',
        _MacroKind.fat => 'Fat',
      };

  double get caloriesPerGram => switch (this) {
        _MacroKind.protein || _MacroKind.carbs => 4,
        _MacroKind.fat => 9,
      };

  double valueFrom(NutrientSet totals) => switch (this) {
        _MacroKind.protein => totals.protein,
        _MacroKind.carbs => totals.carbs,
        _MacroKind.fat => totals.fat,
      };

  double goalFrom(MacroGoal goals) => switch (this) {
        _MacroKind.protein => goals.dailyProtein,
        _MacroKind.carbs => goals.dailyCarbs,
        _MacroKind.fat => goals.dailyFat,
      };
}

class WeeklyMacroChart extends StatefulWidget {
  final List<DayTotals> days;
  final MacroGoal? goals;

  const WeeklyMacroChart({
    super.key,
    required this.days,
    required this.goals,
  });

  @override
  State<WeeklyMacroChart> createState() => _WeeklyMacroChartState();
}

class _WeeklyMacroChartState extends State<WeeklyMacroChart> {
  _MacroChartMode _mode = _MacroChartMode.calorieShare;

  bool _hasMacroData(DayTotals day) {
    return _MacroKind.values.any((macro) => macro.valueFrom(day.totals) > 0);
  }

  double _macroCalories(DayTotals day) {
    return _MacroKind.values.fold(
      0,
      (total, macro) =>
          total + macro.valueFrom(day.totals) * macro.caloriesPerGram,
    );
  }

  double _calorieShare(DayTotals day, _MacroKind macro) {
    final macroCalories = _macroCalories(day);
    if (macroCalories <= 0) return 0;
    return macro.valueFrom(day.totals) *
        macro.caloriesPerGram *
        100 /
        macroCalories;
  }

  double? _goalCalorieShare(_MacroKind macro) {
    final goals = widget.goals;
    if (goals == null) return null;

    final goalCalories = _MacroKind.values.fold(
      0.0,
      (total, kind) => total + kind.goalFrom(goals) * kind.caloriesPerGram,
    );
    if (goalCalories <= 0) return null;

    return macro.goalFrom(goals) * macro.caloriesPerGram * 100 / goalCalories;
  }

  double _niceAxisMaximum(double value) {
    if (value <= 0) return 100;

    final roughStep = value / 4;
    final magnitude =
        math.pow(10, (math.log(roughStep) / math.ln10).floor()).toDouble();
    final normalized = roughStep / magnitude;
    final niceNormalized = normalized <= 1
        ? 1
        : normalized <= 2
            ? 2
            : normalized <= 5
                ? 5
                : 10;

    return niceNormalized * magnitude * 4;
  }

  double _gramsAxisMaximum() {
    var maximum = 0.0;
    for (final day in widget.days) {
      for (final macro in _MacroKind.values) {
        maximum = math.max(maximum, macro.valueFrom(day.totals));
      }
    }
    final goals = widget.goals;
    if (goals != null) {
      for (final macro in _MacroKind.values) {
        maximum = math.max(maximum, macro.goalFrom(goals));
      }
    }
    return _niceAxisMaximum(maximum);
  }

  String _format(double value, [int maximumFractionDigits = 1]) {
    if (maximumFractionDigits == 0) {
      return value.round().toString();
    }
    final fixed = value.toStringAsFixed(maximumFractionDigits);
    return fixed.endsWith('.0') ? fixed.substring(0, fixed.length - 2) : fixed;
  }

  String _tooltipMessage(DayTotals day, _MacroKind macro) {
    final grams = macro.valueFrom(day.totals);
    final share = _calorieShare(day, macro);
    final goal = widget.goals == null ? null : macro.goalFrom(widget.goals!);
    final lines = [
      DateFormat('EEE, MMM d').format(AppDate.parse(day.date)),
      '${macro.label}: ${_format(grams)} g',
      'Calorie share: ${_format(share)}%',
    ];

    if (goal != null) {
      final progress = goal > 0 ? ' (${_format(grams / goal * 100)}%)' : '';
      lines.add('Target: ${_format(goal)} g$progress');
    }
    return lines.join('\n');
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final trackedDays = widget.days.where(_hasMacroData).toList();
    final averages = <_MacroKind, double>{
      for (final macro in _MacroKind.values)
        macro: trackedDays.isEmpty
            ? 0
            : trackedDays.fold(
                  0.0,
                  (total, day) => total + macro.valueFrom(day.totals),
                ) /
                trackedDays.length,
    };
    final axisMaximum =
        _mode == _MacroChartMode.calorieShare ? 100.0 : _gramsAxisMaximum();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final heading = Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Macros by day',
                      style:
                          TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Compare protein, carbohydrates, and fat across tracked days.',
                      style: TextStyle(
                        fontSize: 13,
                        color: colors.onSurfaceVariant,
                      ),
                    ),
                  ],
                );
                final toggle = SegmentedButton<_MacroChartMode>(
                  showSelectedIcon: false,
                  segments: const [
                    ButtonSegment(
                      value: _MacroChartMode.calorieShare,
                      label: Text('Calorie share'),
                    ),
                    ButtonSegment(
                      value: _MacroChartMode.grams,
                      label: Text('Grams'),
                    ),
                  ],
                  selected: {_mode},
                  onSelectionChanged: (selection) {
                    setState(() => _mode = selection.first);
                  },
                  style: const ButtonStyle(
                    visualDensity: VisualDensity.compact,
                  ),
                );

                if (constraints.maxWidth < 560) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      heading,
                      const SizedBox(height: 14),
                      SizedBox(width: double.infinity, child: toggle),
                    ],
                  );
                }

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: heading),
                    const SizedBox(width: 16),
                    toggle,
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            ..._MacroKind.values.map(
              (macro) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _AverageRow(
                  color: colors.primary,
                  label: macro.label,
                  average: trackedDays.isEmpty
                      ? 'No tracked days'
                      : '${_format(averages[macro]!)} g average',
                  goal: widget.goals == null
                      ? null
                      : '${_format(macro.goalFrom(widget.goals!))} g target',
                ),
              ),
            ),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: colors.surfaceContainerHigh,
                border: Border.all(color: colors.outlineVariant),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '${trackedDays.length} of ${widget.days.length} days tracked',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const SizedBox(height: 14),
            _ChartLegend(hasGoals: widget.goals != null),
            const SizedBox(height: 12),
            _GroupedBars(
              days: widget.days,
              mode: _mode,
              axisMaximum: axisMaximum,
              hasData: _hasMacroData,
              rawValue: (day, macro) => _mode == _MacroChartMode.calorieShare
                  ? _calorieShare(day, macro)
                  : macro.valueFrom(day.totals),
              goalValue: (macro) => _mode == _MacroChartMode.calorieShare
                  ? _goalCalorieShare(macro)
                  : widget.goals == null
                      ? null
                      : macro.goalFrom(widget.goals!),
              tooltipMessage: _tooltipMessage,
              format: _format,
            ),
            const SizedBox(height: 10),
            Text(
              _mode == _MacroChartMode.calorieShare
                  ? 'Calorie share uses 4 calories per gram of protein or '
                      'carbohydrates and 9 per gram of fat.'
                  : 'Target markers use your saved daily protein, carbohydrate, '
                      'and fat targets.',
              style: TextStyle(fontSize: 12, color: colors.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            Text(
              'Tap a bar for exact values.',
              style: TextStyle(fontSize: 12, color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _AverageRow extends StatelessWidget {
  final Color color;
  final String label;
  final String average;
  final String? goal;

  const _AverageRow({
    required this.color,
    required this.label,
    required this.average,
    required this.goal,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHigh,
        border: Border.all(color: colors.outlineVariant),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  goal == null ? average : '$average · $goal',
                  style: TextStyle(
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ChartLegend extends StatelessWidget {
  final bool hasGoals;

  const _ChartLegend({required this.hasGoals});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Wrap(
      spacing: 14,
      runSpacing: 8,
      children: [
        ..._MacroKind.values.map(
          (macro) => _LegendItem(
            color: colors.primary,
            label: macro.label,
          ),
        ),
        _LegendItem(color: colors.error, label: 'Over target'),
        if (hasGoals)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 18,
                height: 2,
                color: colors.onSurface.withValues(alpha: 0.65),
              ),
              const SizedBox(width: 6),
              Text(
                'Saved target',
                style: TextStyle(
                  fontSize: 12,
                  color: colors.onSurfaceVariant,
                ),
              ),
            ],
          ),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;

  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 9,
          height: 9,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

class _GroupedBars extends StatelessWidget {
  static const _plotHeight = 210.0;
  static const _dayLabelHeight = 42.0;
  static const _axisWidth = 44.0;
  static const _minimumPlotWidth = 630.0;

  final List<DayTotals> days;
  final _MacroChartMode mode;
  final double axisMaximum;
  final bool Function(DayTotals day) hasData;
  final double Function(DayTotals day, _MacroKind macro) rawValue;
  final double? Function(_MacroKind macro) goalValue;
  final String Function(DayTotals day, _MacroKind macro) tooltipMessage;
  final String Function(double value, int maximumFractionDigits) format;

  const _GroupedBars({
    required this.days,
    required this.mode,
    required this.axisMaximum,
    required this.hasData,
    required this.rawValue,
    required this.goalValue,
    required this.tooltipMessage,
    required this.format,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final scaleValues = List.generate(
      5,
      (index) => axisMaximum - axisMaximum / 4 * index,
    );

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = math.max(
          constraints.maxWidth,
          _axisWidth + _minimumPlotWidth,
        );
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: width,
            height: _plotHeight + _dayLabelHeight,
            child: Stack(
              children: [
                Positioned(
                  left: 0,
                  top: 0,
                  width: _axisWidth - 6,
                  height: _plotHeight,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: scaleValues
                        .map(
                          (value) => Text(
                            '${format(value, 0)}${mode == _MacroChartMode.calorieShare ? '%' : ' g'}',
                            style: TextStyle(
                              fontSize: 10,
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
                Positioned(
                  left: _axisWidth,
                  right: 0,
                  top: 0,
                  height: _plotHeight,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: List.generate(
                      5,
                      (_) => Divider(
                        height: 1,
                        thickness: 1,
                        color: colors.outlineVariant.withValues(alpha: 0.65),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: _axisWidth,
                  right: 0,
                  top: 0,
                  height: _plotHeight + _dayLabelHeight,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: days
                        .map(
                          (day) => Expanded(
                            child: _DayBars(
                              day: day,
                              hasData: hasData(day),
                              mode: mode,
                              axisMaximum: axisMaximum,
                              rawValue: rawValue,
                              goalValue: goalValue,
                              tooltipMessage: tooltipMessage,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _DayBars extends StatelessWidget {
  final DayTotals day;
  final bool hasData;
  final _MacroChartMode mode;
  final double axisMaximum;
  final double Function(DayTotals day, _MacroKind macro) rawValue;
  final double? Function(_MacroKind macro) goalValue;
  final String Function(DayTotals day, _MacroKind macro) tooltipMessage;

  const _DayBars({
    required this.day,
    required this.hasData,
    required this.mode,
    required this.axisMaximum,
    required this.rawValue,
    required this.goalValue,
    required this.tooltipMessage,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Column(
      children: [
        SizedBox(
          height: _GroupedBars._plotHeight,
          child: Align(
            alignment: Alignment.bottomCenter,
            child: hasData
                ? Row(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: _MacroKind.values.map((macro) {
                      final value = rawValue(day, macro);
                      final target = goalValue(macro);
                      final overTarget =
                          target != null && target > 0 && value > target;
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 3),
                        child: _MacroBar(
                          color: overTarget ? colors.error : colors.primary,
                          fraction: (value / axisMaximum).clamp(0.0, 1.0),
                          goalFraction: target == null
                              ? null
                              : (target / axisMaximum).clamp(0.0, 1.0),
                          tooltip: tooltipMessage(day, macro),
                          semanticsLabel:
                              '${DateFormat('EEE, MMM d').format(AppDate.parse(day.date))}, '
                              '${macro.label}, ${mode == _MacroChartMode.calorieShare ? 'calorie share' : 'grams'}',
                        ),
                      );
                    }).toList(),
                  )
                : Container(
                    width: 60,
                    height: _GroupedBars._plotHeight,
                    decoration: BoxDecoration(
                      color: colors.surfaceContainerHigh.withValues(alpha: 0.5),
                      border: Border.all(color: colors.outlineVariant),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: RotatedBox(
                        quarterTurns: 3,
                        child: Text(
                          'No data',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ),
                  ),
          ),
        ),
        SizedBox(
          height: _GroupedBars._dayLabelHeight,
          child: Center(
            child: Text(
              DateFormat('EEE\nM/d').format(AppDate.parse(day.date)),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                color: colors.onSurfaceVariant,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MacroBar extends StatelessWidget {
  final Color color;
  final double fraction;
  final double? goalFraction;
  final String tooltip;
  final String semanticsLabel;

  const _MacroBar({
    required this.color,
    required this.fraction,
    required this.goalFraction,
    required this.tooltip,
    required this.semanticsLabel,
  });

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Tooltip(
      message: tooltip,
      triggerMode: TooltipTriggerMode.tap,
      showDuration: const Duration(seconds: 4),
      preferBelow: false,
      child: Semantics(
        label: semanticsLabel,
        button: true,
        child: SizedBox(
          width: 20,
          height: _GroupedBars._plotHeight,
          child: Stack(
            alignment: Alignment.bottomCenter,
            children: [
              Positioned(
                left: 1,
                right: 1,
                bottom: 0,
                height: math.max(
                  3,
                  _GroupedBars._plotHeight * fraction,
                ),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 280),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(5),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withValues(alpha: 0.12),
                        offset: const Offset(0, 1),
                        blurRadius: 0,
                      ),
                    ],
                  ),
                ),
              ),
              if (goalFraction != null)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: (_GroupedBars._plotHeight * goalFraction!)
                      .clamp(0, _GroupedBars._plotHeight - 2),
                  child: Container(
                    height: 2,
                    color: colors.onSurface.withValues(alpha: 0.68),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
