import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';

class FoodEntryForm extends StatefulWidget {
  final FoodEntry? existing;
  final VoidCallback? onSaved;

  const FoodEntryForm({super.key, this.existing, this.onSaved});

  bool get isEdit => existing != null;

  @override
  State<FoodEntryForm> createState() => _FoodEntryFormState();
}

class _FoodEntryFormState extends State<FoodEntryForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _serving;
  late final Map<String, TextEditingController> _nutrition;
  late MealType _meal;
  late String _dateApi;

  @override
  void initState() {
    super.initState();
    final entry = widget.existing;
    _name = TextEditingController(text: entry?.foodName ?? '');
    _serving = TextEditingController(text: entry?.servingSize ?? '');
    _nutrition = {
      'calories': TextEditingController(text: _number(entry?.calories)),
      'protein': TextEditingController(text: _number(entry?.protein)),
      'carbs': TextEditingController(text: _number(entry?.carbs)),
      'fat': TextEditingController(text: _number(entry?.fat)),
      'fiber': TextEditingController(text: _number(entry?.fiber)),
      'saturatedFat': TextEditingController(text: _number(entry?.saturatedFat)),
      'transFat': TextEditingController(text: _number(entry?.transFat)),
      'sugar': TextEditingController(text: _number(entry?.sugar)),
      'sodium': TextEditingController(text: _number(entry?.sodium)),
      'potassium': TextEditingController(text: _number(entry?.potassium)),
      'calcium': TextEditingController(text: _number(entry?.calcium)),
      'iron': TextEditingController(text: _number(entry?.iron)),
      'vitaminC': TextEditingController(text: _number(entry?.vitaminC)),
      'vitaminD': TextEditingController(text: _number(entry?.vitaminD)),
    };
    _meal = entry?.mealType ?? MealType.breakfast;
    _dateApi = entry?.date ?? context.read<DashboardProvider>().date;
  }

  String _number(double? value) {
    if (value == null) return '0';
    return value == value.roundToDouble()
        ? value.toInt().toString()
        : value.toString();
  }

  @override
  void dispose() {
    _name.dispose();
    _serving.dispose();
    for (final controller in _nutrition.values) {
      controller.dispose();
    }
    super.dispose();
  }

  double _value(String key) {
    final value = double.tryParse(_nutrition[key]!.text.trim());
    return value == null || !value.isFinite || value < 0 ? 0 : value;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final input = FoodEntryInput(
      foodName: _name.text.trim(),
      servingSize: _serving.text.trim(),
      mealType: _meal,
      calories: _value('calories'),
      protein: _value('protein'),
      carbs: _value('carbs'),
      fat: _value('fat'),
      fiber: _value('fiber'),
      saturatedFat: _value('saturatedFat'),
      transFat: _value('transFat'),
      sugar: _value('sugar'),
      sodium: _value('sodium'),
      potassium: _value('potassium'),
      calcium: _value('calcium'),
      iron: _value('iron'),
      vitaminC: _value('vitaminC'),
      vitaminD: _value('vitaminD'),
      date: _dateApi,
    );

    final foods = context.read<FoodEntryProvider>();
    final saved = widget.isEdit
        ? await foods.update(widget.existing!.id, input)
        : await foods.create(input);

    if (!mounted) return;

    if (saved) {
      await context.read<DashboardProvider>().load();
      if (!mounted) return;

      if (widget.isEdit) {
        widget.onSaved?.call();
      } else {
        _name.clear();
        _serving.clear();
        for (final controller in _nutrition.values) {
          controller.text = '0';
        }
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Food added')),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(foods.error ?? 'Could not save food')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final foods = context.watch<FoodEntryProvider>();

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _name,
            textCapitalization: TextCapitalization.sentences,
            decoration: const InputDecoration(
              labelText: 'Food name',
              hintText: 'e.g. Grilled chicken breast',
            ),
            validator: (value) => value == null || value.trim().isEmpty
                ? 'Food name is required'
                : null,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _serving,
            decoration: const InputDecoration(
              labelText: 'Serving size',
              hintText: 'e.g. 6 oz',
            ),
            validator: (value) => value == null || value.trim().isEmpty
                ? 'Serving size is required'
                : null,
          ),
          const SizedBox(height: 16),
          const Text('Meal', style: TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: MealType.values.map((meal) {
              return ChoiceChip(
                label: Text(meal.label),
                selected: _meal == meal,
                onSelected: (_) => setState(() => _meal = meal),
              );
            }).toList(),
          ),
          const SizedBox(height: 18),
          _pair(
            _numericField('calories', 'Calories', 'kcal'),
            _numericField('protein', 'Protein', 'g'),
          ),
          const SizedBox(height: 14),
          _pair(
            _numericField('carbs', 'Carbohydrates', 'g'),
            _numericField('fat', 'Total fat', 'g'),
          ),
          const SizedBox(height: 14),
          _numericField('fiber', 'Fiber', 'g'),
          _numericField('sugar', 'Total sugar', 'g'),
          const SizedBox(height: 8),
          ExpansionTile(
            tilePadding: EdgeInsets.zero,
            childrenPadding: const EdgeInsets.only(bottom: 12),
            initiallyExpanded: widget.isEdit,
            title: const Text(
              'Micronutrients and fat details',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            children: [
              _pair(
                _numericField('saturatedFat', 'Saturated fat', 'g'),
                _numericField('transFat', 'Trans fat', 'g'),
              ),
              const SizedBox(height: 14),
              _pair(
                _numericField('sodium', 'Sodium', 'mg'),
                _numericField('potassium', 'Potassium', 'mg'),
              ),
              const SizedBox(height: 14),
              _pair(
                _numericField('calcium', 'Calcium', 'mg'),
                _numericField('iron', 'Iron', 'mg'),
              ),
              const SizedBox(height: 14),
              _pair(
                _numericField('vitaminC', 'Vitamin C', 'mg'),
                _numericField('vitaminD', 'Vitamin D', 'mcg'),
              ),
            ],
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: foods.submitting ? null : _submit,
            style:
                FilledButton.styleFrom(minimumSize: const Size.fromHeight(54)),
            child: foods.submitting
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(widget.isEdit ? 'Save changes' : 'Add food'),
          ),
        ],
      ),
    );
  }

  Widget _pair(Widget first, Widget second) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: first),
        const SizedBox(width: 12),
        Expanded(child: second),
      ],
    );
  }

  Widget _numericField(String key, String label, String unit) {
    return TextFormField(
      controller: _nutrition[key],
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
      decoration: InputDecoration(labelText: '$label ($unit)', hintText: '0'),
      validator: (value) {
        final text = value?.trim() ?? '';
        if (text.isEmpty) return null;
        final number = double.tryParse(text);
        if (number == null || !number.isFinite) return 'Enter a number';
        if (number < 0) return 'Must be 0+';
        return null;
      },
    );
  }
}
