import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';

/// Server-backed USDA FoodData Central search. Search and add both round-trip
/// through the Express API; the mobile client never receives the USDA API key.
class VerifiedFoodSearch extends StatefulWidget {
  const VerifiedFoodSearch({super.key});

  @override
  State<VerifiedFoodSearch> createState() => _VerifiedFoodSearchState();
}

class _VerifiedFoodSearchState extends State<VerifiedFoodSearch> {
  final _queryController = TextEditingController();
  MealType _mealType = MealType.lunch;

  @override
  void dispose() {
    _queryController.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    FocusScope.of(context).unfocus();
    await context
        .read<FoodEntryProvider>()
        .searchPresets(_queryController.text);
  }

  Future<void> _add(PresetFood food) async {
    final foods = context.read<FoodEntryProvider>();
    final dashboard = context.read<DashboardProvider>();
    final added = await foods.addPreset(
      food,
      mealType: _mealType,
      date: dashboard.date,
    );
    if (!mounted) return;

    if (added) {
      await Future.wait([dashboard.load(), foods.loadRecent()]);
      if (!mounted) return;
    }

    final colors = Theme.of(context).colorScheme;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(
            added
                ? '${food.foodName} added to ${_mealType.label}.'
                : foods.error ?? 'Could not add this food.',
          ),
          backgroundColor: added ? null : colors.error,
        ),
      );
  }

  String _format(double value) => value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final foods = context.watch<FoodEntryProvider>();
    final colors = Theme.of(context).colorScheme;

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
                  decoration: BoxDecoration(
                    color: colors.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: colors.primary.withValues(alpha: 0.30),
                    ),
                  ),
                  child: Icon(
                    Icons.verified_outlined,
                    color: colors.onPrimaryContainer,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Search verified food data',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Search USDA FoodData Central and add a serving to this day.',
                        style: TextStyle(color: colors.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _queryController,
              maxLength: 80,
              textInputAction: TextInputAction.search,
              onSubmitted: (_) {
                if (!foods.searchingPresets) _search();
              },
              decoration: const InputDecoration(
                labelText: 'Food or brand',
                hintText: 'e.g. Greek yogurt',
                prefixIcon: Icon(Icons.search),
              ),
            ),
            const SizedBox(height: 8),
            LayoutBuilder(
              builder: (context, constraints) {
                final mealField = DropdownButtonFormField<MealType>(
                  initialValue: _mealType,
                  decoration: const InputDecoration(labelText: 'Meal'),
                  items: [
                    for (final meal in MealType.values)
                      DropdownMenuItem(
                        value: meal,
                        child: Text(meal.label),
                      ),
                  ],
                  onChanged: foods.searchingPresets
                      ? null
                      : (meal) {
                          if (meal != null) {
                            setState(() => _mealType = meal);
                          }
                        },
                );
                final searchButton = OutlinedButton.icon(
                  onPressed: foods.searchingPresets ? null : _search,
                  icon: foods.searchingPresets
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.search),
                  label: Text(
                    foods.searchingPresets ? 'Searching\u2026' : 'Search',
                  ),
                );

                if (constraints.maxWidth < 440) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      mealField,
                      const SizedBox(height: 10),
                      searchButton,
                    ],
                  );
                }

                return Row(
                  children: [
                    Expanded(child: mealField),
                    const SizedBox(width: 10),
                    searchButton,
                  ],
                );
              },
            ),
            if (foods.presetError != null) ...[
              const SizedBox(height: 12),
              Text(
                foods.presetError!,
                style: TextStyle(color: colors.error),
              ),
            ],
            if (foods.presetSearchCompleted &&
                !foods.searchingPresets &&
                foods.presetResults.isEmpty) ...[
              const SizedBox(height: 14),
              Text(
                'No USDA matches found. Try a simpler food or brand name.',
                style: TextStyle(color: colors.onSurfaceVariant),
              ),
            ],
            if (foods.presetResults.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: foods.presetResults.length,
                separatorBuilder: (_, __) => const Divider(),
                itemBuilder: (context, index) {
                  final food = foods.presetResults[index];
                  final adding = foods.addingPresetId == food.fdcId;
                  final addDisabled = foods.addingPresetId != null;

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                food.foodName,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              if (food.brand != null &&
                                  food.brand!.trim().isNotEmpty)
                                Text(
                                  food.brand!,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: colors.onSurfaceVariant,
                                  ),
                                ),
                              const SizedBox(height: 3),
                              Text(
                                '${food.servingSize} \u00B7 '
                                '${_format(food.calories)} kcal \u00B7 '
                                'P ${_format(food.protein)}g \u00B7 '
                                'C ${_format(food.carbs)}g \u00B7 '
                                'F ${_format(food.fat)}g',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: colors.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton(
                          onPressed: addDisabled ? null : () => _add(food),
                          child: Text(adding ? 'Adding\u2026' : '+ Add'),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
            const SizedBox(height: 12),
            Text(
              'Nutrition source: USDA FoodData Central. Values reflect the serving shown.',
              style: TextStyle(
                fontSize: 12,
                color: colors.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
