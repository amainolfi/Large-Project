import 'package:flutter/material.dart';

import '../models/food_entry.dart';

/// One meal card (Breakfast / Lunch / Dinner / Snack), matching the mockups:
/// a header with meal name + total kcal, then each entry with its serving,
/// a compact macro line, and Edit / Delete actions.
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

  String _fmt(double n) =>
      n == n.roundToDouble() ? n.toInt().toString() : n.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return const SizedBox.shrink();

    final subTextColor = Colors.white.withOpacity(0.55);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                meal.label,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                '${_fmt(totalCalories)} kcal',
                style: TextStyle(fontSize: 15, color: subTextColor),
              ),
            ],
          ),
          Divider(color: Colors.white.withOpacity(0.08), height: 24),
          ...entries.map((e) => _EntryRow(
                entry: e,
                onEdit: () => onEdit(e),
                onDelete: () => onDelete(e),
              )),
        ],
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

  String _fmt(double n) =>
      n == n.roundToDouble() ? n.toInt().toString() : n.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    final subTextColor = Colors.white.withOpacity(0.55);
    final macroLine =
        '${_fmt(entry.calories)} kcal · P ${_fmt(entry.protein)}g · '
        'C ${_fmt(entry.carbs)}g · F ${_fmt(entry.fat)}g';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.foodName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(entry.servingSize,
                    style: TextStyle(fontSize: 14, color: subTextColor)),
                const SizedBox(height: 4),
                Text(macroLine,
                    style: TextStyle(fontSize: 13, color: subTextColor)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              GestureDetector(
                onTap: onEdit,
                child: Text('Edit',
                    style: TextStyle(fontSize: 15, color: subTextColor)),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: onDelete,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFF453A),
                  side: BorderSide(color: Colors.white.withOpacity(0.12)),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  minimumSize: Size.zero,
                ),
                child: const Text('Delete'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
