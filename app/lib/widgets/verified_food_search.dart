import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';

/// Search USDA FoodData Central and add a verified serving to the current day.
/// Search results, in-flight, and error state live in [FoodEntryProvider];
/// this widget keeps only the query text and the selected meal locally.
class VerifiedFoodSearch extends StatefulWidget {
  const VerifiedFoodSearch({super.key});

  @override
  State<VerifiedFoodSearch> createState() => _VerifiedFoodSearchState();
}

class _VerifiedFoodSearchState extends State<VerifiedFoodSearch> {
  final _query = TextEditingController();
  MealType _meal = MealType.lunch;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    FocusScope.of(context).unfocus();
    await context.read<FoodEntryProvider>().searchPresets(_query.text);
  }

  Future<void> _add(PresetFood food) async {
    final foods = context.read<FoodEntryProvider>();
    final dashboard = context.read<DashboardProvider>();
    final added = await foods.addPreset(
      food,
      mealType: _meal,
      date: dashboard.date,
    );
    if (!mounted) return;

    if (added) {
      await Future.wait([dashboard.load(), foods.loadRecent()]);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${food.foodName} added to ${_meal.label}.')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(foods.error ?? 'Could not add this food.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final foods = context.watch<FoodEntryProvider>();
    final searching = foods.searchingPresets;
    final results = foods.presetResults;
    final adding = foods.addingPresetId != null;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: colors.secondaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.verified_outlined,
                      color: colors.onSecondaryContainer, size: 22),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Search verified foods',
                          style: TextStyle(
                              fontSize: 20, fontWeight: FontWeight.bold)),
                      SizedBox(height: 2),
                      Text('Add a USDA FoodData Central serving to this day.'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _query,
              textInputAction: TextInputAction.search,
              maxLength: 80,
              onSubmitted: (_) {
                if (!searching) _search();
              },
              decoration: const InputDecoration(
                labelText: 'Food or brand',
                hintText: 'e.g. Greek yogurt',
                counterText: '',
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<MealType>(
              initialValue: _meal,
              decoration: const InputDecoration(labelText: 'Meal'),
              items: MealType.values
                  .map((meal) => DropdownMenuItem(
                        value: meal,
                        child: Text(meal.label),
                      ))
                  .toList(),
              onChanged: (meal) {
                if (meal != null) setState(() => _meal = meal);
              },
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: searching ? null : _search,
                icon: searching
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.search),
                label: Text(searching ? 'Searching…' : 'Search'),
              ),
            ),
            if (foods.presetError != null) ...[
              const SizedBox(height: 12),
              Text(foods.presetError!, style: TextStyle(color: colors.error)),
            ],
            if (foods.presetSearchCompleted &&
                !searching &&
                foods.presetError == null &&
                results.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  'No USDA matches. Try a different search.',
                  style: TextStyle(color: colors.onSurfaceVariant),
                ),
              ),
            if (results.isNotEmpty) ...[
              const SizedBox(height: 4),
              for (final food in results)
                _PresetRow(
                  food: food,
                  adding: foods.addingPresetId == food.fdcId,
                  disabled: adding,
                  onAdd: () => _add(food),
                ),
              const SizedBox(height: 8),
              Text(
                'Nutrition source: USDA FoodData Central.',
                style: TextStyle(fontSize: 12, color: colors.onSurfaceVariant),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PresetRow extends StatelessWidget {
  final PresetFood food;
  final bool adding;
  final bool disabled;
  final VoidCallback onAdd;

  const _PresetRow({
    required this.food,
    required this.adding,
    required this.disabled,
    required this.onAdd,
  });

  String _format(double value) => value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final brandPrefix = (food.brand != null && food.brand!.isNotEmpty)
        ? '${food.brand} · '
        : '';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(food.foodName,
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '$brandPrefix${food.servingSize} · ${_format(food.calories)} kcal',
                  style: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          OutlinedButton(
            onPressed: disabled ? null : onAdd,
            child: adding
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('+ Add'),
          ),
        ],
      ),
    );
  }
}
