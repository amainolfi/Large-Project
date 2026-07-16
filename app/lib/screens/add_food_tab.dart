import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';
import '../widgets/ai_food_logger.dart';
import '../widgets/food_entry_form.dart';

class AddFoodTab extends StatefulWidget {
  const AddFoodTab({super.key});

  @override
  State<AddFoodTab> createState() => _AddFoodTabState();
}

class _AddFoodTabState extends State<AddFoodTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FoodEntryProvider>().loadRecent();
    });
  }

  Future<void> _quickAdd(FoodEntry entry) async {
    final foods = context.read<FoodEntryProvider>();
    final dashboard = context.read<DashboardProvider>();
    final added = await foods.quickAdd(entry.id, dashboard.date);
    if (!mounted) return;

    if (added) {
      await dashboard.load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added ${entry.foodName}')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(foods.error ?? 'Could not add food')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final foods = context.watch<FoodEntryProvider>();
    final date = context.watch<DashboardProvider>().date;
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Add food',
                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                AppDate.display(date),
                style: TextStyle(color: colors.onSurfaceVariant),
              ),
              const SizedBox(height: 20),
              const AiFoodLogger(),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Log manually',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(
                        'Enter label values and expand the micronutrient section as needed.',
                        style: TextStyle(color: colors.onSurfaceVariant),
                      ),
                      const SizedBox(height: 16),
                      const FoodEntryForm(),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text('Recent foods',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (foods.loadingRecent)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (foods.recent.isEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  child: Text(
                    'No recent foods yet.',
                    style: TextStyle(color: colors.onSurfaceVariant),
                  ),
                )
              else
                Card(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Column(
                      children: foods.recent
                          .map((entry) => _RecentRow(
                                entry: entry,
                                onAdd: () => _quickAdd(entry),
                              ))
                          .toList(),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentRow extends StatelessWidget {
  final FoodEntry entry;
  final VoidCallback onAdd;

  const _RecentRow({required this.entry, required this.onAdd});

  String _format(double value) => value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.foodName,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '${entry.servingSize} · ${_format(entry.calories)} kcal',
                  style: TextStyle(fontSize: 14, color: colors.onSurfaceVariant),
                ),
              ],
            ),
          ),
          OutlinedButton(onPressed: onAdd, child: const Text('+ Add')),
        ],
      ),
    );
  }
}
