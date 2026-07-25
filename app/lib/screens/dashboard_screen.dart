import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../models/daily_summary.dart';
import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/macro_progress_bar.dart';
import '../widgets/meal_section.dart';
import 'add_edit_food_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String? _pendingDeleteId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = context.watch<DashboardProvider>();
    final summary = dashboard.summary;
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => context.read<DashboardProvider>().load(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Dashboard',
                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                AppDate.display(dashboard.date),
                style: TextStyle(fontSize: 16, color: colors.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              _DateNavigator(dashboard: dashboard),
              const SizedBox(height: 20),
              if (dashboard.loading && summary == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 60),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (dashboard.error != null && summary == null)
                _ErrorBlock(
                  message: dashboard.error!,
                  onRetry: () => context.read<DashboardProvider>().load(),
                )
              else if (summary != null) ...[
                const Text('Macros, fiber, and sugar',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ..._primaryProgress(summary),
                _micronutrientProgress(summary),
                const SizedBox(height: 24),
                const Text('Food log',
                    style:
                        TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ..._mealSections(context, dashboard),
                if (dashboard.foods.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Text(
                        'Nothing logged for this day yet.',
                        style: TextStyle(color: colors.onSurfaceVariant),
                      ),
                    ),
                  ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _primaryProgress(DailySummary summary) {
    final bars = [
      MacroProgressBar(
          label: 'Calories',
          value: summary.totals.calories,
          goal: summary.goals.calories,
          percent: summary.progress.calories,
          unit: 'kcal'),
      MacroProgressBar(
          label: 'Protein',
          value: summary.totals.protein,
          goal: summary.goals.protein,
          percent: summary.progress.protein,
          unit: 'g'),
      MacroProgressBar(
          label: 'Carbohydrates',
          value: summary.totals.carbs,
          goal: summary.goals.carbs,
          percent: summary.progress.carbs,
          unit: 'g'),
      MacroProgressBar(
          label: 'Total fat',
          value: summary.totals.fat,
          goal: summary.goals.fat,
          percent: summary.progress.fat,
          unit: 'g'),
      MacroProgressBar(
          label: 'Fiber',
          value: summary.totals.fiber,
          goal: summary.goals.fiber,
          percent: summary.progress.fiber,
          unit: 'g'),
      MacroProgressBar(
          label: 'Sugar',
          value: summary.totals.sugar,
          goal: summary.goals.sugar,
          percent: summary.progress.sugar,
          unit: 'g',
          isLimit: true),
    ];
    return [
      for (final bar in bars) ...[bar, const SizedBox(height: 10)]
    ];
  }

  Widget _micronutrientProgress(DailySummary summary) {
    final bars = [
      MacroProgressBar(
          label: 'Saturated fat',
          value: summary.totals.saturatedFat,
          goal: summary.goals.saturatedFat,
          percent: summary.progress.saturatedFat,
          unit: 'g',
          isLimit: true),
      MacroProgressBar(
          label: 'Trans fat',
          value: summary.totals.transFat,
          goal: summary.goals.transFat,
          percent: summary.progress.transFat,
          unit: 'g',
          isLimit: true),
      MacroProgressBar(
          label: 'Sodium',
          value: summary.totals.sodium,
          goal: summary.goals.sodium,
          percent: summary.progress.sodium,
          unit: 'mg',
          isLimit: true),
      MacroProgressBar(
          label: 'Potassium',
          value: summary.totals.potassium,
          goal: summary.goals.potassium,
          percent: summary.progress.potassium,
          unit: 'mg'),
      MacroProgressBar(
          label: 'Calcium',
          value: summary.totals.calcium,
          goal: summary.goals.calcium,
          percent: summary.progress.calcium,
          unit: 'mg'),
      MacroProgressBar(
          label: 'Iron',
          value: summary.totals.iron,
          goal: summary.goals.iron,
          percent: summary.progress.iron,
          unit: 'mg'),
      MacroProgressBar(
          label: 'Vitamin C',
          value: summary.totals.vitaminC,
          goal: summary.goals.vitaminC,
          percent: summary.progress.vitaminC,
          unit: 'mg'),
      MacroProgressBar(
          label: 'Vitamin D',
          value: summary.totals.vitaminD,
          goal: summary.goals.vitaminD,
          percent: summary.progress.vitaminD,
          unit: 'mcg'),
    ];

    return Card(
      child: ExpansionTile(
        title: const Text('Micronutrients and limits',
            style: TextStyle(fontWeight: FontWeight.w700)),
        childrenPadding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        children: [
          for (final bar in bars) ...[bar, const SizedBox(height: 10)]
        ],
      ),
    );
  }

  List<Widget> _mealSections(
      BuildContext context, DashboardProvider dashboard) {
    return [
      for (final meal in MealType.values)
        MealSection(
          meal: meal,
          entries: dashboard.foodsForMeal(meal),
          totalCalories: dashboard.caloriesForMeal(meal),
          pendingDeleteId: _pendingDeleteId,
          onEdit: (entry) async {
            setState(() => _pendingDeleteId = null);
            await Navigator.of(context).push(
              MaterialPageRoute(
                  builder: (_) => AddEditFoodScreen(existing: entry)),
            );
            if (!context.mounted) return;
            await context.read<DashboardProvider>().load();
          },
          onDelete: (entry) => _deleteFood(dashboard, entry),
          onCancelDelete: () => setState(() => _pendingDeleteId = null),
        ),
    ];
  }

  Future<void> _deleteFood(
    DashboardProvider dashboard,
    FoodEntry entry,
  ) async {
    if (_pendingDeleteId != entry.id) {
      setState(() => _pendingDeleteId = entry.id);
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(
            content: Text(
              'Review "${entry.foodName}", then tap Confirm delete.',
            ),
          ),
        );
      return;
    }

    final deleted = await dashboard.deleteFood(entry.id);
    if (!mounted) return;
    setState(() => _pendingDeleteId = null);
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            deleted
                ? '${entry.foodName} deleted.'
                : dashboard.error ?? 'Could not delete this food.',
          ),
          backgroundColor: deleted ? null : Theme.of(context).colorScheme.error,
        ),
      );
  }
}

class _DateNavigator extends StatelessWidget {
  final DashboardProvider dashboard;

  const _DateNavigator({required this.dashboard});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => context.read<DashboardProvider>().goPrev(),
            child: const Text('← Prev'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: dashboard.isToday
              ? FilledButton(
                  onPressed: () => context.read<DashboardProvider>().goToday(),
                  child: const Text('Today'),
                )
              : OutlinedButton(
                  onPressed: () => context.read<DashboardProvider>().goToday(),
                  child: const Text('Today'),
                ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton(
            onPressed: () => context.read<DashboardProvider>().goNext(),
            child: const Text('Next →'),
          ),
        ),
      ],
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
