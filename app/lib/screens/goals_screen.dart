import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/macro_goal.dart';
import '../providers/dashboard_provider.dart';
import '../providers/goals_provider.dart';

/// Daily goals screen (screenshot 7): six numeric targets — Calories,
/// Protein, Carbs, Saturated Fat, Trans Fat, Sodium — plus Save. Saving
/// refreshes the Dashboard so the progress bars reflect the new targets
/// right away.
class GoalsScreen extends StatefulWidget {
  const GoalsScreen({super.key});

  @override
  State<GoalsScreen> createState() => _GoalsScreenState();
}

class _GoalsScreenState extends State<GoalsScreen> {
  final _formKey = GlobalKey<FormState>();

  final _calories = TextEditingController();
  final _protein = TextEditingController();
  final _carbs = TextEditingController();
  final _saturatedFat = TextEditingController();
  final _transFat = TextEditingController();
  final _sodium = TextEditingController();

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
    for (final c in [_calories, _protein, _carbs, _saturatedFat, _transFat, _sodium]) {
      c.dispose();
    }
    super.dispose();
  }

  String _num(double v) =>
      v == v.roundToDouble() ? v.toInt().toString() : v.toString();

  /// Fill the fields from loaded goals once (so we don't clobber user edits
  /// on every rebuild).
  void _prefillIfNeeded(MacroGoal? goals) {
    if (_prefilled || goals == null) return;
    _calories.text = _num(goals.dailyCalories);
    _protein.text = _num(goals.dailyProtein);
    _carbs.text = _num(goals.dailyCarbs);
    _saturatedFat.text = _num(goals.dailySaturatedFat);
    _transFat.text = _num(goals.dailyTransFat);
    _sodium.text = _num(goals.dailySodium);
    _prefilled = true;
  }

  double _parse(TextEditingController c) {
    final n = double.tryParse(c.text.trim());
    if (n == null || n.isNaN || n.isInfinite || n < 0) return 0;
    return n;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final input = MacroGoalInput(
      dailyCalories: _parse(_calories),
      dailyProtein: _parse(_protein),
      dailyCarbs: _parse(_carbs),
      dailySaturatedFat: _parse(_saturatedFat),
      dailyTransFat: _parse(_transFat),
      dailySodium: _parse(_sodium),
    );

    final goals = context.read<GoalsProvider>();
    final ok = await goals.save(input);
    if (!mounted) return;

    if (ok) {
      // Refresh the dashboard so progress bars use the new goals.
      await context.read<DashboardProvider>().load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Goals saved')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(goals.error ?? 'Could not save goals')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final goals = context.watch<GoalsProvider>();
    _prefillIfNeeded(goals.goals);

    return Scaffold(
      body: SafeArea(
        child: goals.loading && !_prefilled
            ? const Center(child: CircularProgressIndicator())
            : Form(
                key: _formKey,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    const Text('Daily goals',
                        style: TextStyle(
                            fontSize: 34, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text('Update your daily targets.',
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.55))),
                    const SizedBox(height: 24),
                    _field(_calories, 'Calories (kcal)', 'Daily energy target'),
                    const SizedBox(height: 20),
                    _field(_protein, 'Protein (g)', 'Daily target'),
                    const SizedBox(height: 20),
                    _field(_carbs, 'Carbohydrates (g)', 'Daily target'),
                    const SizedBox(height: 20),
                    _field(_saturatedFat, 'Saturated fat (g)', 'Daily limit'),
                    const SizedBox(height: 20),
                    _field(_transFat, 'Trans fat (g)', 'Daily limit'),
                    const SizedBox(height: 20),
                    _field(_sodium, 'Sodium (mg)', 'Daily limit'),
                    const SizedBox(height: 28),
                    FilledButton(
                      onPressed: goals.saving ? null : _save,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(56),
                      ),
                      child: goals.saving
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child:
                                  CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Save goals'),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _field(TextEditingController c, String label, String helper) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style:
                const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextFormField(
          controller: c,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
          ],
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            helperText: helper,
            hintText: '0',
          ),
          validator: (v) {
            final text = v?.trim() ?? '';
            if (text.isEmpty) return null; // blank = 0
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
