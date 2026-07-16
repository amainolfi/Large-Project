import 'package:flutter/material.dart';

import '../models/food_entry.dart';

class MealSection extends StatelessWidget {
  final MealType meal;
  final List<FoodEntry> entries;
  final double totalCalories;
  final void Function(FoodEntry entry) onEdit;
  final void Function(FoodEntry entry) onDelete;

  const MealSection({
    super.key,
    required this.meal,
    required this.entries,
    required this.totalCalories,
    required this.onEdit,
    required this.onDelete,
  });

  String _format(double number) => number == number.roundToDouble()
      ? number.toInt().toString()
      : number.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return const SizedBox.shrink();
    final colors = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(meal.label,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  Text('${_format(totalCalories)} kcal',
                      style: TextStyle(color: colors.onSurfaceVariant)),
                ],
              ),
              const Divider(height: 24),
              ...entries.map((entry) => _EntryRow(
                    entry: entry,
                    onEdit: () => onEdit(entry),
                    onDelete: () => onDelete(entry),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _EntryRow extends StatelessWidget {
  final FoodEntry entry;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _EntryRow({
    required this.entry,
    required this.onEdit,
    required this.onDelete,
  });

  String _format(double number) => number == number.roundToDouble()
      ? number.toInt().toString()
      : number.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final sourceLabel = switch (entry.source) {
      FoodSource.ai => 'AI estimate',
      FoodSource.usda => 'USDA',
      FoodSource.manual => null,
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Text(entry.foodName,
                            style: const TextStyle(
                                fontSize: 17, fontWeight: FontWeight.w600)),
                        if (sourceLabel != null)
                          Chip(
                            visualDensity: VisualDensity.compact,
                            label: Text(sourceLabel,
                                style: const TextStyle(fontSize: 11)),
                          ),
                      ],
                    ),
                    Text(entry.servingSize,
                        style: TextStyle(color: colors.onSurfaceVariant)),
                    const SizedBox(height: 4),
                    Text(
                      '${_format(entry.calories)} kcal · P ${_format(entry.protein)}g · '
                      'C ${_format(entry.carbs)}g · F ${_format(entry.fat)}g · '
                      'Fiber ${_format(entry.fiber)}g',
                      style: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              PopupMenuButton<String>(
                tooltip: 'Food actions',
                onSelected: (action) => action == 'edit' ? onEdit() : onDelete(),
                itemBuilder: (_) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(value: 'delete', child: Text('Delete')),
                ],
              ),
            ],
          ),
          ExpansionTile(
            dense: true,
            tilePadding: EdgeInsets.zero,
            childrenPadding: const EdgeInsets.only(bottom: 4),
            title: Text('Micronutrients',
                style: TextStyle(fontSize: 13, color: colors.primary)),
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Saturated fat ${_format(entry.saturatedFat)}g · '
                  'Trans fat ${_format(entry.transFat)}g · '
                  'Sodium ${_format(entry.sodium)}mg · '
                  'Potassium ${_format(entry.potassium)}mg · '
                  'Calcium ${_format(entry.calcium)}mg · '
                  'Iron ${_format(entry.iron)}mg · '
                  'Vitamin C ${_format(entry.vitaminC)}mg · '
                  'Vitamin D ${_format(entry.vitaminD)}mcg',
                  style: TextStyle(fontSize: 12, color: colors.onSurfaceVariant),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
