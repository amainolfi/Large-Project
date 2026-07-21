import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../models/daily_summary.dart';
import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/macro_progress_bar.dart';
import '../widgets/meal_section.dart';
import 'add_edit_food_screen.dart';

/// The main dashboard, matching your mockups: a date navigator, six macro
/// progress bars from the daily summary, and the day's food grouped by meal.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Load once after first frame so the provider is available.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dash = context.watch<DashboardProvider>();
    final summary = dash.summary;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => context.read<DashboardProvider>().load(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _Header(dateApi: dash.date),
              const SizedBox(height: 16),
              _DateNavigator(dash: dash),
              const SizedBox(height: 20),
              if (dash.loading && summary == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (dash.error != null && summary == null)
                _ErrorBlock(
                  message: dash.error!,
                  onRetry: () => context.read<DashboardProvider>().load(),
                )
              else if (summary != null) ...[
                ..._buildProgressBars(summary),
                const SizedBox(height: 8),
                ..._buildMeals(context, dash),
              ],
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _buildProgressBars(DailySummary s) {
    final bars = <Widget>[
      MacroProgressBar(
        label: 'Calories',
        value: s.totals.calories,
        goal: s.goals.calories,
        percent: s.progress.calories,
        unit: 'kcal',
      ),
      MacroProgressBar(
        label: 'Protein',
        value: s.totals.protein,
        goal: s.goals.protein,
        percent: s.progress.protein,
        unit: 'g',
      ),
      MacroProgressBar(
        label: 'Carbs',
        value: s.totals.carbs,
        goal: s.goals.carbs,
        percent: s.progress.carbs,
        unit: 'g',
      ),
      MacroProgressBar(
        label: 'Saturated fat',
        value: s.totals.saturatedFat,
        goal: s.goals.saturatedFat,
        percent: s.progress.saturatedFat,
        unit: 'g',
      ),
      MacroProgressBar(
        label: 'Trans fat',
        value: s.totals.transFat,
        goal: s.goals.transFat,
        percent: s.progress.transFat,
        unit: 'g',
      ),
      MacroProgressBar(
        label: 'Sodium',
        value: s.totals.sodium,
        goal: s.goals.sodium,
        percent: s.progress.sodium,
        unit: 'mg',
      ),
    ];
    // Spacing between bars.
    return [
      for (final bar in bars) ...[bar, const SizedBox(height: 12)],
    ];
  }

  List<Widget> _buildMeals(BuildContext context, DashboardProvider dash) {
    return [
      for (final meal in MealType.values)
        MealSection(
          meal: meal,
          entries: dash.foodsForMeal(meal),
          totalCalories: dash.caloriesForMeal(meal),
          onEdit: (entry) async {
            await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => AddEditFoodScreen(existing: entry),
              ),
            );
            // Dashboard already refreshes after a successful edit, but reload
            // here too in case the user changed the entry's date.
            if (context.mounted) {
              context.read<DashboardProvider>().load();
            }
          },
          onDelete: (entry) => _confirmDelete(context, dash, entry),
        ),
    ];
  }

  Future<void> _confirmDelete(
      BuildContext context, DashboardProvider dash, FoodEntry entry) async {
    // Single confirmation dialog (the requirements ask for one alert only).
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete entry?'),
        content: Text('Remove "${entry.foodName}" from ${entry.mealType.label}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFFF453A)),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await dash.deleteFood(entry.id);
    }
  }
}

class _Header extends StatelessWidget {
  final String dateApi;
  const _Header({required this.dateApi});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Dashboard',
          style: TextStyle(
            fontSize: 34,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          AppDate.display(dateApi),
          style: TextStyle(fontSize: 16, color: Colors.white.withOpacity(0.55)),
        ),
      ],
    );
  }
}

class _DateNavigator extends StatelessWidget {
  final DashboardProvider dash;
  const _DateNavigator({required this.dash});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _NavButton(
          label: '← Prev',
          onTap: () => context.read<DashboardProvider>().goPrev(),
        ),
        const SizedBox(width: 10),
        _NavButton(
          label: 'Today',
          filled: dash.isToday,
          onTap: () => context.read<DashboardProvider>().goToday(),
        ),
        const SizedBox(width: 10),
        _NavButton(
          label: 'Next →',
          onTap: () => context.read<DashboardProvider>().goNext(),
        ),
      ],
    );
  }
}

class _NavButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _NavButton({
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF34C759);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: filled ? green : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: filled ? Colors.black : green,
          ),
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
