import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/macro_goal.dart';
import '../providers/dashboard_provider.dart';
import '../providers/goals_provider.dart';

class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalField {
  final String keyName;
  final String label;
  final String helper;

  const _GoalField(this.keyName, this.label, this.helper);
}

class _GoalsScreenState extends State<GoalsScreen> {
  final _formKey = GlobalKey<FormState>();

  final _controllers = <String, TextEditingController>{
    'calories': TextEditingController(text: '2000'),
    'protein': TextEditingController(text: '150'),
    'carbs': TextEditingController(text: '250'),
    'fat': TextEditingController(text: '70'),
    'saturatedFat': TextEditingController(text: '20'),
    'transFat': TextEditingController(text: '2'),
    'fiber': TextEditingController(text: '28'),
    'sodium': TextEditingController(text: '2300'),
    'potassium': TextEditingController(text: '4700'),
    'calcium': TextEditingController(text: '1300'),
    'iron': TextEditingController(text: '18'),
    'vitaminC': TextEditingController(text: '90'),
    'vitaminD': TextEditingController(text: '20'),
  };

  static const _primaryFields = [
    _GoalField('calories', 'Calories (kcal)', 'Energy target'),
    _GoalField('protein', 'Protein (g)', 'Macro target'),
    _GoalField('carbs', 'Carbohydrates (g)', 'Macro target'),
    _GoalField('fat', 'Total fat (g)', 'Macro target'),
    _GoalField('fiber', 'Fiber (g)', 'Daily target'),
  ];

  static const _detailFields = [
    _GoalField('saturatedFat', 'Saturated fat (g)', 'Daily limit'),
    _GoalField('transFat', 'Trans fat (g)', 'Daily limit'),
    _GoalField('sodium', 'Sodium (mg)', 'Daily limit'),
    _GoalField('potassium', 'Potassium (mg)', 'Daily target'),
    _GoalField('calcium', 'Calcium (mg)', 'Daily target'),
    _GoalField('iron', 'Iron (mg)', 'Daily target'),
    _GoalField('vitaminC', 'Vitamin C (mg)', 'Daily target'),
    _GoalField('vitaminD', 'Vitamin D (mcg)', 'Daily target'),
  ];

  bool _prefilled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<GoalsProvider>().load();
    });
  }

  @override
  void dispose() {
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  String _number(double value) => value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toString();

  void _prefillIfNeeded(MacroGoal? goals) {
    if (_prefilled || goals == null) return;
    _controllers['calories']!.text = _number(goals.dailyCalories);
    _controllers['protein']!.text = _number(goals.dailyProtein);
    _controllers['carbs']!.text = _number(goals.dailyCarbs);
    _controllers['fat']!.text = _number(goals.dailyFat);
    _controllers['saturatedFat']!.text = _number(goals.dailySaturatedFat);
    _controllers['transFat']!.text = _number(goals.dailyTransFat);
    _controllers['fiber']!.text = _number(goals.dailyFiber);
    _controllers['sodium']!.text = _number(goals.dailySodium);
    _controllers['potassium']!.text = _number(goals.dailyPotassium);
    _controllers['calcium']!.text = _number(goals.dailyCalcium);
    _controllers['iron']!.text = _number(goals.dailyIron);
    _controllers['vitaminC']!.text = _number(goals.dailyVitaminC);
    _controllers['vitaminD']!.text = _number(goals.dailyVitaminD);
    _prefilled = true;
  }

  double _value(String key) {
    final value = double.tryParse(_controllers[key]!.text.trim());
    return value == null || !value.isFinite || value < 0 ? 0 : value;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final input = MacroGoalInput(
      dailyCalories: _value('calories'),
      dailyProtein: _value('protein'),
      dailyCarbs: _value('carbs'),
      dailyFat: _value('fat'),
      dailySaturatedFat: _value('saturatedFat'),
      dailyTransFat: _value('transFat'),
      dailyFiber: _value('fiber'),
      dailySodium: _value('sodium'),
      dailyPotassium: _value('potassium'),
      dailyCalcium: _value('calcium'),
      dailyIron: _value('iron'),
      dailyVitaminC: _value('vitaminC'),
      dailyVitaminD: _value('vitaminD'),
    );

    final provider = context.read<GoalsProvider>();
    final saved = await provider.save(input);
    if (!mounted) return;

    if (saved) {
      await context.read<DashboardProvider>().load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Goals saved')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Could not save goals')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<GoalsProvider>();
    final colors = Theme.of(context).colorScheme;
    _prefillIfNeeded(provider.goals);

    return Scaffold(
      body: SafeArea(
        child: provider.loading && !_prefilled
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _formKey,
                child: ListView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  padding: const EdgeInsets.all(16),
                  children: [
                    const Text('Daily goals',
                        style: TextStyle(
                            fontSize: 34, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                      'Set the targets and limits used across your dashboard.',
                      style: TextStyle(color: colors.onSurfaceVariant),
                    ),
                    const SizedBox(height: 24),
                    _section('Macros and fiber', _primaryFields),
                    const SizedBox(height: 16),
                    _section('Micronutrients and limits', _detailFields),
                    const SizedBox(height: 12),
                    Text(
                      'Starting values are general examples, not personalized medical guidance.',
                      style: TextStyle(
                          fontSize: 12, color: colors.onSurfaceVariant),
                    ),
                    const SizedBox(height: 20),
                    FilledButton(
                      onPressed: provider.saving ? null : _save,
                      child: provider.saving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save all goals'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _section(String title, List<_GoalField> fields) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            for (var index = 0; index < fields.length; index++) ...[
              _field(fields[index]),
              if (index != fields.length - 1) const SizedBox(height: 16),
            ],
          ],
        ),
      ),
    );
  }

  Widget _field(_GoalField field) {
    return TextFormField(
      controller: _controllers[field.keyName],
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
      decoration: InputDecoration(
        labelText: field.label,
        helperText: field.helper,
        hintText: '0',
      ),
      validator: (value) {
        final text = value?.trim() ?? '';
        if (text.isEmpty) return null;
        final number = double.tryParse(text);
        if (number == null || !number.isFinite) return 'Enter a number';
        if (number < 0) return 'Must be 0 or more';
        return null;
      },
    );
  }
}
