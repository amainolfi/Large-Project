import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../models/weekly_summary.dart';
import '../providers/history_provider.dart';

/// Weekly history (screenshot 6): a calorie-by-day bar chart with an over-goal
/// threshold, plus a daily totals list. Week navigation via Prev / Last 7 days
/// / Next.
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

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => context.read<HistoryProvider>().load(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Weekly history',
                  style:
                      TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('${history.startDate} to ${history.endDate}',
                  style:
                      TextStyle(color: Colors.white.withOpacity(0.55))),
              const SizedBox(height: 16),
              _WeekNav(history: history),
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
                _CaloriesChart(
                  days: summary.days,
                  goal: history.calorieGoal,
                ),
                const SizedBox(height: 20),
                _DailyTotalsList(days: summary.days),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _WeekNav extends StatelessWidget {
  final HistoryProvider history;
  const _WeekNav({required this.history});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _navBtn(context, '← Prev week',
            () => context.read<HistoryProvider>().prevWeek()),
        const SizedBox(width: 10),
        _navBtn(context, 'Last 7 days',
            () => context.read<HistoryProvider>().lastSevenDays(),
            filled: history.isCurrentWeek),
        const SizedBox(width: 10),
        _navBtn(context, 'Next week →',
            () => context.read<HistoryProvider>().nextWeek()),
      ],
    );
  }

  Widget _navBtn(BuildContext context, String label, VoidCallback onTap,
      {bool filled = false}) {
    const green = Color(0xFF34C759);
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: filled ? green : Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: filled ? Colors.black : green,
            ),
          ),
        ),
      ),
    );
  }
}

/// Vertical calorie bars, one per day. Bars fill relative to the goal (or to
/// the week's max if no goal). Days over the goal render red, matching the
/// mockup note "Red bars are over goal."
class _CaloriesChart extends StatelessWidget {
  final List<DayTotals> days;
  final double? goal;

  const _CaloriesChart({required this.days, required this.goal});

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF34C759);
    const red = Color(0xFFFF453A);

    // Scale reference: the goal if set, else the largest day (so bars are
    // still meaningful without goals).
    final maxCalories = days.fold<double>(
        0, (m, d) => d.totals.calories > m ? d.totals.calories : m);
    final scaleMax = (goal != null && goal! > 0)
        ? (goal! > maxCalories ? goal! : maxCalories)
        : (maxCalories > 0 ? maxCalories : 1);

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
          const Text('Calories by day',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          SizedBox(
            height: 180,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: days.map((d) {
                final cal = d.totals.calories;
                final overGoal = goal != null && cal > goal!;
                final fraction = (cal / scaleMax).clamp(0.0, 1.0);
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text(
                          cal == 0 ? '' : cal.toInt().toString(),
                          style: const TextStyle(fontSize: 11),
                        ),
                        const SizedBox(height: 4),
                        // Track + fill.
                        Expanded(
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              return Stack(
                                alignment: Alignment.bottomCenter,
                                children: [
                                  Container(
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.05),
                                      borderRadius:
                                          BorderRadius.circular(6),
                                    ),
                                  ),
                                  Container(
                                    height: constraints.maxHeight * fraction,
                                    decoration: BoxDecoration(
                                      color: overGoal ? red : green,
                                      borderRadius:
                                          BorderRadius.circular(6),
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(_weekday(d.date),
                            style: const TextStyle(fontSize: 12)),
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
            style: TextStyle(
                fontSize: 13, color: Colors.white.withOpacity(0.55)),
          ),
        ],
      ),
    );
  }

  String _weekday(String apiDate) => DateFormat('EEE').format(AppDate.parse(apiDate));
}

class _DailyTotalsList extends StatelessWidget {
  final List<DayTotals> days;
  const _DailyTotalsList({required this.days});

  String _fmt(double n) =>
      n == n.roundToDouble() ? n.toInt().toString() : n.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
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
          const Text('Daily totals',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...days.map((d) {
            final t = d.totals;
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    DateFormat('EEE, MMM d').format(AppDate.parse(d.date)),
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_fmt(t.calories)} kcal · P ${_fmt(t.protein)}g · '
                    'C ${_fmt(t.carbs)}g · SF ${_fmt(t.saturatedFat)}g · '
                    'TF ${_fmt(t.transFat)}g · Na ${_fmt(t.sodium)}mg',
                    style: TextStyle(fontSize: 14, color: subTextColor),
                  ),
                ],
              ),
            );
          }),
        ],
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
