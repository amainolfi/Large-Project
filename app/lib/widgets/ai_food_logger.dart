import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';

class AiFoodLogger extends StatefulWidget {
  const AiFoodLogger({super.key});

  @override
  State<AiFoodLogger> createState() => _AiFoodLoggerState();
}

class _AiFoodLoggerState extends State<AiFoodLogger> {
  final _description = TextEditingController();
  MealType _meal = MealType.lunch;
  String? _error;

  @override
  void dispose() {
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _description.text.trim();
    if (text.length < 2) {
      setState(() => _error = 'Describe the food or drink you consumed.');
      return;
    }

    setState(() => _error = null);
    final foods = context.read<FoodEntryProvider>();
    final dashboard = context.read<DashboardProvider>();
    final count = await foods.logWithAi(
      text: text,
      date: dashboard.date,
      mealType: _meal,
    );
    if (!mounted) return;

    if (count != null) {
      _description.clear();
      await Future.wait([dashboard.load(), foods.loadRecent()]);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '$count estimated ${count == 1 ? 'entry' : 'entries'} logged. Review and edit if needed.',
          ),
        ),
      );
    } else {
      setState(() => _error = foods.error ?? 'Could not log this meal.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final busy = context.watch<FoodEntryProvider>().submitting;

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
                    color: colors.primaryContainer,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'AI',
                    style: TextStyle(
                      color: colors.onPrimaryContainer,
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Describe what you ate',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                      SizedBox(height: 2),
                      Text('Create editable nutrition estimates from plain language.'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _description,
              minLines: 3,
              maxLines: 5,
              maxLength: 500,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Food description',
                hintText: 'I had one medium banana and a rice cake for lunch',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<MealType>(
              initialValue: _meal,
              decoration: const InputDecoration(labelText: 'Default meal'),
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
            Text(
              'Food and drink already consumed only. AI nutrition is an estimate, not medical advice.',
              style: TextStyle(fontSize: 12, color: colors.onSurfaceVariant),
            ),
            if (_error != null) ...[
              const SizedBox(height: 10),
              Text(_error!, style: TextStyle(color: colors.error)),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: busy ? null : _submit,
              icon: busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.auto_awesome),
              label: Text(busy ? 'Estimating…' : 'Log with AI'),
            ),
          ],
        ),
      ),
    );
  }
}
