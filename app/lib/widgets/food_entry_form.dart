import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/food_entry.dart';
import '../providers/dashboard_provider.dart';
import '../providers/food_entry_provider.dart';

/// The food entry form as a self-contained Column (no Scaffold, no scroll view
/// of its own), so it can be embedded inside any scrolling parent — the Add
/// Food tab or the standalone Edit screen.
///
/// Handles its own submit: on success it refreshes the dashboard, then either
/// clears (add mode) or calls [onSaved] (edit mode, used to pop the route).
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
  late final TextEditingController _calories;
  late final TextEditingController _protein;
  late final TextEditingController _carbs;
  late final TextEditingController _saturatedFat;
  late final TextEditingController _transFat;
  late final TextEditingController _sodium;

  late MealType _meal;
  late String _dateApi;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?.foodName ?? '');
    _serving = TextEditingController(text: e?.servingSize ?? '');
    _calories = TextEditingController(text: _num(e?.calories));
    _protein = TextEditingController(text: _num(e?.protein));
    _carbs = TextEditingController(text: _num(e?.carbs));
    _saturatedFat = TextEditingController(text: _num(e?.saturatedFat));
    _transFat = TextEditingController(text: _num(e?.transFat));
    _sodium = TextEditingController(text: _num(e?.sodium));
    _meal = e?.mealType ?? MealType.breakfast;
    _dateApi = e?.date ?? context.read<DashboardProvider>().date;
  }

  String _num(double? v) {
    if (v == null) return '';
    return v == v.roundToDouble() ? v.toInt().toString() : v.toString();
  }

  @override
  void dispose() {
    for (final c in [
      _name, _serving, _calories, _protein, _carbs,
      _saturatedFat, _transFat, _sodium
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  double _parse(TextEditingController c) {
    final n = double.tryParse(c.text.trim());
    // Guard against null, NaN, and infinity — always send a clean, finite
    // number the backend will accept.
    if (n == null || n.isNaN || n.isInfinite || n < 0) return 0;
    return n;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final input = FoodEntryInput(
      foodName: _name.text.trim(),
      servingSize: _serving.text.trim(),
      mealType: _meal,
      calories: _parse(_calories),
      protein: _parse(_protein),
      carbs: _parse(_carbs),
      saturatedFat: _parse(_saturatedFat),
      transFat: _parse(_transFat),
      sodium: _parse(_sodium),
      date: _dateApi,
    );

    final foods = context.read<FoodEntryProvider>();
    final ok = widget.isEdit
        ? await foods.update(widget.existing!.id, input)
        : await foods.create(input);

    if (!mounted) return;

    if (ok) {
      await context.read<DashboardProvider>().load();
      if (!mounted) return;

      if (widget.isEdit) {
        widget.onSaved?.call();
      } else {
        _formKey.currentState!.reset();
        _name.clear();
        _serving.clear();
        for (final c in [
          _calories, _protein, _carbs, _saturatedFat, _transFat, _sodium
        ]) {
          c.clear();
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
          _label('Food name'),
          _textField(_name, hint: 'e.g. Grilled Chicken Breast', requiredField: true),
          const SizedBox(height: 16),
          _label('Serving size'),
          _textField(_serving, hint: 'e.g. 6 oz', requiredField: true),
          const SizedBox(height: 16),
          _label('Meal'),
          const SizedBox(height: 8),
          _MealSelector(
            selected: _meal,
            onChanged: (m) => setState(() => _meal = m),
          ),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(child: _numberField(_calories, 'Calories')),
            const SizedBox(width: 12),
            Expanded(child: _numberField(_protein, 'Protein (g)')),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _numberField(_carbs, 'Carbs (g)')),
            const SizedBox(width: 12),
            Expanded(child: _numberField(_saturatedFat, 'Saturated fat (g)')),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _numberField(_transFat, 'Trans fat (g)')),
            const SizedBox(width: 12),
            Expanded(child: _numberField(_sodium, 'Sodium (mg)')),
          ]),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: foods.submitting ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(56)),
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

  Widget _label(String text) => Text(
        text,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      );

  Widget _textField(TextEditingController c,
      {String? hint, bool requiredField = false}) {
    return TextFormField(
      controller: c,
      decoration: InputDecoration(
        hintText: hint,
        border: const OutlineInputBorder(),
      ),
      validator: requiredField
          ? (v) => (v == null || v.trim().isEmpty) ? 'Required' : null
          : null,
    );
  }

  Widget _numberField(TextEditingController c, String label) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        const SizedBox(height: 8),
        TextFormField(
          controller: c,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
          ],
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            hintText: '0',
          ),
          validator: (v) {
            final text = v?.trim() ?? '';
            // Blank is allowed and treated as 0 (common when logging food).
            if (text.isEmpty) return null;
            final n = double.tryParse(text);
            if (n == null) return 'Enter a number';
            if (n < 0) return 'Must be 0 or more';
            return null;
          },
        ),
      ],
    );
  }
}

class _MealSelector extends StatelessWidget {
  final MealType selected;
  final ValueChanged<MealType> onChanged;

  const _MealSelector({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    const green = Color(0xFF34C759);
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: MealType.values.map((m) {
        final isSelected = m == selected;
        return GestureDetector(
          onTap: () => onChanged(m),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? green : Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Text(
              m.label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.black : green,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
