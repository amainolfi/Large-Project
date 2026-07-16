import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../models/weekly_summary.dart';
import '../providers/history_provider.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<HistoryProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final history = context.watch<HistoryProvider>();
    final summary = history.summary;
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => context.read<HistoryProvider>().load(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Weekly history',
                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                '${history.startDate} to ${history.endDate}',
                style: TextStyle(color: colors.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              _WeekNavigation(history: history),
              const SizedBox(height: 20),
              if (history.loading && summary == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (history.error != null && summary == null)
                _ErrorBlock(
                  message: history.error!,
                  onRetry: () => context.read<HistoryProvider>().load(),
                )
              else if (summary != null) ...[
                _CaloriesChart(days: summary.days, goal: history.calorieGoal),
                const SizedBox(height: 16),
                _DailyTotalsList(days: summary.days),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _WeekNavigation extends StatelessWidget {
  final HistoryProvider history;

  const _WeekNavigation({required this.history});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => context.read<HistoryProvider>().prevWeek(),
            child: const Text('← Prev'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: history.isCurrentWeek
              ? FilledButton(
                  onPressed: () => context.read<HistoryProvider>().lastSevenDays(),
                  child: const Text('Last 7 days'),
                )
              : OutlinedButton(
                  onPressed: () => context.read<HistoryProvider>().lastSevenDays(),
                  child: const Text('Last 7 days'),
                ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton(
            onPressed: () => context.read<HistoryProvider>().nextWeek(),
            child: const Text('Next →'),
          ),
        ),
      ],
    );
  }
}

class _CaloriesChart extends StatelessWidget {
  final List<DayTotals> days;
  final double? goal;

  const _CaloriesChart({required this.days, required this.goal});

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final maximum = days.fold<double>(
      0,
      (current, day) => day.totals.calories > current
          ? day.totals.calories
          : current,
    );
    final scale = goal != null && goal! > maximum
        ? goal!
        : maximum > 0
            ? maximum
            : 1;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Calories by day',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            SizedBox(
              height: 180,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: days.map((day) {
                  final calories = day.totals.calories;
                  final overGoal = goal != null && calories > goal!;
                  final fraction = (calories / scale).clamp(0.0, 1.0);
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text(calories == 0 ? '' : calories.toInt().toString(),
                              style: const TextStyle(fontSize: 11)),
                          const SizedBox(height: 4),
                          Expanded(
                            child: LayoutBuilder(
                              builder: (context, constraints) => Stack(
                                alignment: Alignment.bottomCenter,
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      color: colors.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                  Container(
                                    height: constraints.maxHeight * fraction,
                                    decoration: BoxDecoration(
                                      color: overGoal ? colors.error : colors.primary,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            DateFormat('EEE').format(AppDate.parse(day.date)),
                            style: const TextStyle(fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              goal != null
                  ? 'Daily goal: ${goal!.toInt()} kcal. Red bars are over goal.'
                  : 'Set a calorie goal to see over-goal days.',
              style: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
            ),
          ],
        ),
      ),
    );
  }
}

class _DailyTotalsList extends StatelessWidget {
  final List<DayTotals> days;

  const _DailyTotalsList({required this.days});

  String _format(double number) => number == number.roundToDouble()
      ? number.toInt().toString()
      : number.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text('Daily nutrition totals',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            ),
            ...days.map((day) {
              final totals = day.totals;
              return ExpansionTile(
                title: Text(
                  DateFormat('EEE, MMM d').format(AppDate.parse(day.date)),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${_format(totals.calories)} kcal · P ${_format(totals.protein)}g · '
                  'C ${_format(totals.carbs)}g · F ${_format(totals.fat)}g · '
                  'Fiber ${_format(totals.fiber)}g',
                  style: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
                ),
                childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Saturated fat ${_format(totals.saturatedFat)}g · '
                      'Trans fat ${_format(totals.transFat)}g · '
                      'Sodium ${_format(totals.sodium)}mg · '
                      'Potassium ${_format(totals.potassium)}mg · '
                      'Calcium ${_format(totals.calcium)}mg · '
                      'Iron ${_format(totals.iron)}mg · '
                      'Vitamin C ${_format(totals.vitaminC)}mg · '
                      'Vitamin D ${_format(totals.vitaminD)}mcg',
                      style: TextStyle(fontSize: 12, color: colors.onSurfaceVariant),
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _ErrorBlock extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;

  const _ErrorBlock({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          FilledButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
