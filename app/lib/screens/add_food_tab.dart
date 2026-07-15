import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';
import '../widgets/food_entry_form.dart';

/// The "Add Food" tab: the log-a-new-food form followed by the Recent Foods
/// quick-add list, matching screenshots 4 and 5. Everything lives in a single
/// scroll view (no nested scrollables).
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
    final date = context.read<DashboardProvider>().date;
    final ok = await foods.quickAdd(entry.id, date);
    if (!mounted) return;
    if (ok) {
      await context.read<DashboardProvider>().load();
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
    final dateApi = context.watch<DashboardProvider>().date;

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
              Text(AppDate.display(dateApi),
                  style: TextStyle(color: Colors.white.withOpacity(0.55))),
              const SizedBox(height: 20),
              const FoodEntryForm(),
              const SizedBox(height: 24),
              Divider(color: Colors.white.withOpacity(0.08)),
              const SizedBox(height: 16),
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
                  child: Text('No recent foods yet.',
                      style: TextStyle(color: Colors.white.withOpacity(0.55))),
                )
              else
                ...foods.recent.map((e) => _RecentRow(
                      entry: e,
                      onAdd: () => _quickAdd(e),
                    )),
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

  String _fmt(double n) =>
      n == n.roundToDouble() ? n.toInt().toString() : n.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF34C759);
    final subTextColor = Colors.white.withOpacity(0.55);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(entry.foodName,
                    style: const TextStyle(
                        fontSize: 17, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('${entry.servingSize} · ${_fmt(entry.calories)} kcal',
                    style: TextStyle(fontSize: 14, color: subTextColor)),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: onAdd,
            style: OutlinedButton.styleFrom(
              foregroundColor: green,
              side: BorderSide(color: green.withOpacity(0.5)),
            ),
            child: const Text('+ Add'),
          ),
        ],
      ),
    );
  }
}
