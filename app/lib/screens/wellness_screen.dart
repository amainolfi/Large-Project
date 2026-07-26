import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config/app_date.dart';
import '../config/app_theme.dart';
import '../models/wellness.dart';
import '../providers/wellness_provider.dart';

class WellnessScreen extends StatefulWidget {
  const WellnessScreen({super.key});

  @override
  State<WellnessScreen> createState() => _WellnessScreenState();
}

class _WellnessScreenState extends State<WellnessScreen> {
  final _waterController = TextEditingController(text: '500');
  final _cardioDurationController = TextEditingController(text: '30');
  final _cardioDistanceController = TextEditingController(text: '0');
  final _cardioCaloriesController = TextEditingController(text: '0');
  final _cardioNotesController = TextEditingController();
  final _sleepHoursController = TextEditingController(text: '8');
  final _sleepMinutesController = TextEditingController(text: '0');
  final _sleepNotesController = TextEditingController();
  final _waterGoalController = TextEditingController(text: '2500');
  final _sleepGoalController = TextEditingController(text: '480');
  final _cardioGoalController = TextEditingController(text: '150');

  ActivityType _activity = ActivityType.running;
  Intensity _intensity = Intensity.moderate;
  SleepQuality _sleepQuality = SleepQuality.good;
  String _pendingDelete = '';
  bool _goalsPrefilled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WellnessProvider>().load();
    });
  }

  @override
  void dispose() {
    _waterController.dispose();
    _cardioDurationController.dispose();
    _cardioDistanceController.dispose();
    _cardioCaloriesController.dispose();
    _cardioNotesController.dispose();
    _sleepHoursController.dispose();
    _sleepMinutesController.dispose();
    _sleepNotesController.dispose();
    _waterGoalController.dispose();
    _sleepGoalController.dispose();
    _cardioGoalController.dispose();
    super.dispose();
  }

  void _prefillGoals(WellnessSummary? summary) {
    if (_goalsPrefilled || summary == null) return;
    _waterGoalController.text = summary.goals.dailyWaterMl.toString();
    _sleepGoalController.text = summary.goals.nightlySleepMinutes.toString();
    _cardioGoalController.text = summary.goals.dailyCardioMinutes.toString();
    _goalsPrefilled = true;
  }

  void _showMessage(String message, {bool error = false}) {
    if (!mounted) return;
    final colors = Theme.of(context).colorScheme;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: error ? colors.error : null,
        ),
      );
  }

  Future<void> _pickDate(WellnessProvider provider) async {
    final selected = await showDatePicker(
      context: context,
      initialDate: AppDate.parse(provider.date),
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (selected == null) return;
    setState(() => _pendingDelete = '');
    await provider.setDate(AppDate.toApi(selected));
  }

  Future<void> _addWater(WellnessProvider provider, int amountMl) async {
    if (amountMl < 1 || amountMl > 5000) {
      _showMessage('Water must be between 1 and 5,000 mL.', error: true);
      return;
    }
    final saved = await provider.addWater(amountMl);
    _showMessage(
        saved
            ? '$amountMl mL added.'
            : provider.error ?? 'Could not add water.',
        error: !saved);
  }

  Future<void> _addCardio(WellnessProvider provider) async {
    final duration = int.tryParse(_cardioDurationController.text.trim());
    final distance = double.tryParse(_cardioDistanceController.text.trim());
    final calories = double.tryParse(_cardioCaloriesController.text.trim());
    if (duration == null || duration < 1 || duration > 1440) {
      _showMessage('Cardio duration must be 1–1,440 minutes.', error: true);
      return;
    }
    if (distance == null || distance < 0 || distance > 1000) {
      _showMessage('Distance must be 0–1,000 km.', error: true);
      return;
    }
    if (calories == null || calories < 0 || calories > 10000) {
      _showMessage('Calories burned must be 0–10,000.', error: true);
      return;
    }

    final saved = await provider.addCardio(
      CardioEntryInput(
        activityType: _activity,
        durationMinutes: duration,
        distanceKm: distance,
        caloriesBurned: calories,
        intensity: _intensity,
        notes: _cardioNotesController.text.trim(),
        date: provider.date,
      ),
    );
    if (saved) _cardioNotesController.clear();
    _showMessage(
        saved
            ? 'Cardio session logged.'
            : provider.error ?? 'Could not log cardio.',
        error: !saved);
  }

  Future<void> _addSleep(WellnessProvider provider) async {
    final hours = int.tryParse(_sleepHoursController.text.trim());
    final minutes = int.tryParse(_sleepMinutesController.text.trim());
    if (hours == null ||
        minutes == null ||
        hours < 0 ||
        hours > 24 ||
        minutes < 0 ||
        minutes > 59) {
      _showMessage('Enter 0–24 hours and 0–59 minutes.', error: true);
      return;
    }
    final duration = hours * 60 + minutes;
    if (duration < 1 || duration > 1440) {
      _showMessage('Sleep must be between 1 minute and 24 hours.', error: true);
      return;
    }

    final saved = await provider.addSleep(
      SleepEntryInput(
        durationMinutes: duration,
        quality: _sleepQuality,
        notes: _sleepNotesController.text.trim(),
        date: provider.date,
      ),
    );
    if (saved) _sleepNotesController.clear();
    _showMessage(
        saved
            ? 'Sleep session logged.'
            : provider.error ?? 'Could not log sleep.',
        error: !saved);
  }

  Future<void> _saveGoals(WellnessProvider provider) async {
    final water = int.tryParse(_waterGoalController.text.trim());
    final sleep = int.tryParse(_sleepGoalController.text.trim());
    final cardio = int.tryParse(_cardioGoalController.text.trim());
    if (water == null ||
        water < 0 ||
        water > 20000 ||
        sleep == null ||
        sleep < 0 ||
        sleep > 1440 ||
        cardio == null ||
        cardio < 0 ||
        cardio > 1440) {
      _showMessage('Enter wellness goals within the displayed ranges.',
          error: true);
      return;
    }

    final saved = await provider.saveGoals(
      WellnessGoal(
        dailyWaterMl: water,
        nightlySleepMinutes: sleep,
        dailyCardioMinutes: cardio,
      ),
    );
    _showMessage(
        saved
            ? 'Wellness goals saved.'
            : provider.error ?? 'Could not save goals.',
        error: !saved);
  }

  Future<void> _delete(
    WellnessProvider provider,
    String kind,
    String id,
  ) async {
    final key = '$kind:$id';
    if (_pendingDelete != key) {
      setState(() => _pendingDelete = key);
      _showMessage('Tap Confirm delete to remove this $kind entry.');
      return;
    }

    bool deleted;
    if (kind == 'water') {
      deleted = await provider.deleteWater(id);
    } else if (kind == 'cardio') {
      deleted = await provider.deleteCardio(id);
    } else {
      deleted = await provider.deleteSleep(id);
    }
    if (mounted) setState(() => _pendingDelete = '');
    _showMessage(
        deleted
            ? '${_capitalize(kind)} entry deleted.'
            : provider.error ?? 'Could not delete entry.',
        error: !deleted);
  }

  String _capitalize(String value) =>
      value.isEmpty ? value : '${value[0].toUpperCase()}${value.substring(1)}';

  String _duration(int minutes) {
    final hours = minutes ~/ 60;
    final remaining = minutes % 60;
    if (hours == 0) return '$remaining min';
    if (remaining == 0) return '$hours hr';
    return '$hours hr $remaining min';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<WellnessProvider>();
    final summary = provider.summary;
    final colors = Theme.of(context).colorScheme;
    _prefillGoals(summary);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: provider.load,
          child: ListView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: const EdgeInsets.all(16),
            children: [
              const Text('Wellness',
                  style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                'Hydration, recovery, and movement in one place.',
                style: TextStyle(color: colors.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              _dateControl(provider),
              const SizedBox(height: 18),
              if (provider.loading && summary == null)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 80),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (provider.error != null && summary == null)
                _errorCard(provider)
              else if (summary != null) ...[
                _summaryCard(
                  icon: Icons.water_drop_outlined,
                  label: 'Hydration',
                  value: '${summary.waterMl} mL',
                  supporting: 'of ${summary.goals.dailyWaterMl} mL today',
                  percent: summary.waterPercent,
                ),
                const SizedBox(height: 10),
                _summaryCard(
                  icon: Icons.bedtime_outlined,
                  label: 'Sleep',
                  value: _duration(summary.sleepMinutes),
                  supporting:
                      'of ${_duration(summary.goals.nightlySleepMinutes)}',
                  percent: summary.sleepPercent,
                ),
                const SizedBox(height: 10),
                _summaryCard(
                  icon: Icons.directions_run,
                  label: 'Cardio today',
                  value: '${summary.cardioMinutes} min',
                  supporting:
                      'of ${summary.goals.dailyCardioMinutes} min today',
                  percent: summary.cardioPercent,
                ),
                const SizedBox(height: 18),
                _waterCard(provider),
                const SizedBox(height: 14),
                _sleepCard(provider),
                const SizedBox(height: 14),
                _cardioCard(provider),
                const SizedBox(height: 14),
                _goalsCard(provider),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _dateControl(WellnessProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          children: [
            IconButton(
              tooltip: 'Previous day',
              onPressed: provider.loading
                  ? null
                  : () => provider.setDate(AppDate.shift(provider.date, -1)),
              icon: const Icon(Icons.chevron_left),
            ),
            Expanded(
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => _pickDate(provider),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Column(
                    children: [
                      Text(AppDate.display(provider.date),
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.w700)),
                      const Text('Tap to choose date',
                          style: TextStyle(fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ),
            IconButton(
              tooltip: 'Next day',
              onPressed: provider.loading
                  ? null
                  : () => provider.setDate(AppDate.shift(provider.date, 1)),
              icon: const Icon(Icons.chevron_right),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorCard(WellnessProvider provider) => Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            children: [
              Text(provider.error ?? 'Could not load wellness data.'),
              const SizedBox(height: 12),
              FilledButton(
                  onPressed: provider.load, child: const Text('Try again')),
            ],
          ),
        ),
      );

  Widget _summaryCard({
    required IconData icon,
    required String label,
    required String value,
    required String supporting,
    required double percent,
  }) {
    final progress = (percent / 100).clamp(0.0, 1.0);
    final color = percent >= 100
        ? AppTheme.success
        : Theme.of(context).colorScheme.primary;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.13),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(value,
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.bold)),
                  Text(supporting, style: const TextStyle(fontSize: 12)),
                  const SizedBox(height: 8),
                  LinearProgressIndicator(value: progress, color: color),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text('${percent.round()}%',
                style: const TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  Widget _waterCard(WellnessProvider provider) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _heading('Hydration', 'Log water',
                  '${provider.waterEntries.length} entries'),
              const SizedBox(height: 14),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final amount in [250, 500, 750])
                    ActionChip(
                      label: Text('+$amount mL'),
                      onPressed: provider.submitting
                          ? null
                          : () => _addWater(provider, amount),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _waterController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                          labelText: 'Custom amount (mL)'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton(
                    onPressed: provider.submitting
                        ? null
                        : () {
                            final amount =
                                int.tryParse(_waterController.text.trim());
                            if (amount == null) {
                              _showMessage('Enter a whole-number water amount.',
                                  error: true);
                            } else {
                              _addWater(provider, amount);
                            }
                          },
                    child: const Text('Add'),
                  ),
                ],
              ),
              _entries(
                provider.waterEntries
                    .map((entry) => _entry(
                          provider: provider,
                          kind: 'water',
                          id: entry.id,
                          title: '${entry.amountMl} mL',
                          subtitle: 'Hydration entry',
                        ))
                    .toList(),
                'No water logged for this day.',
              ),
            ],
          ),
        ),
      );

  Widget _sleepCard(WellnessProvider provider) => Card(
        child: ExpansionTile(
          initiallyExpanded: provider.sleepEntries.isEmpty,
          title: _heading('Recovery', 'Log sleep',
              '${provider.sleepEntries.length} sessions'),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            Row(
              children: [
                Expanded(child: _numberField(_sleepHoursController, 'Hours')),
                const SizedBox(width: 10),
                Expanded(
                    child: _numberField(_sleepMinutesController, 'Minutes')),
              ],
            ),
            const SizedBox(height: 10),
            DropdownButtonFormField<SleepQuality>(
              initialValue: _sleepQuality,
              decoration: const InputDecoration(labelText: 'Sleep quality'),
              items: [
                for (final quality in SleepQuality.values)
                  DropdownMenuItem(value: quality, child: Text(quality.label)),
              ],
              onChanged: (value) =>
                  setState(() => _sleepQuality = value ?? _sleepQuality),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _sleepNotesController,
              maxLength: 500,
              decoration: const InputDecoration(labelText: 'Notes (optional)'),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed:
                    provider.submitting ? null : () => _addSleep(provider),
                child: const Text('Log sleep'),
              ),
            ),
            _entries(
              provider.sleepEntries
                  .map((entry) => _entry(
                        provider: provider,
                        kind: 'sleep',
                        id: entry.id,
                        title: _duration(entry.durationMinutes),
                        subtitle:
                            '${entry.quality.label} quality${entry.notes.isEmpty ? '' : ' · ${entry.notes}'}',
                      ))
                  .toList(),
              'No sleep recorded for this day.',
            ),
          ],
        ),
      );

  Widget _cardioCard(WellnessProvider provider) => Card(
        child: ExpansionTile(
          initiallyExpanded: provider.cardioEntries.isEmpty,
          title: _heading('Movement', 'Log cardio',
              '${provider.cardioEntries.length} sessions'),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            DropdownButtonFormField<ActivityType>(
              initialValue: _activity,
              decoration: const InputDecoration(labelText: 'Activity'),
              items: [
                for (final activity in ActivityType.values)
                  DropdownMenuItem(
                      value: activity, child: Text(activity.label)),
              ],
              onChanged: (value) =>
                  setState(() => _activity = value ?? _activity),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                    child: _numberField(
                        _cardioDurationController, 'Duration (min)')),
                const SizedBox(width: 10),
                Expanded(
                    child: _numberField(
                        _cardioDistanceController, 'Distance (km)',
                        decimal: true)),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                    child: _numberField(
                        _cardioCaloriesController, 'Calories burned',
                        decimal: true)),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<Intensity>(
                    initialValue: _intensity,
                    decoration: const InputDecoration(labelText: 'Intensity'),
                    items: [
                      for (final intensity in Intensity.values)
                        DropdownMenuItem(
                            value: intensity, child: Text(intensity.label)),
                    ],
                    onChanged: (value) =>
                        setState(() => _intensity = value ?? _intensity),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _cardioNotesController,
              maxLength: 500,
              decoration: const InputDecoration(labelText: 'Notes (optional)'),
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed:
                    provider.submitting ? null : () => _addCardio(provider),
                child: const Text('Log cardio'),
              ),
            ),
            _entries(
              provider.cardioEntries
                  .map((entry) => _entry(
                        provider: provider,
                        kind: 'cardio',
                        id: entry.id,
                        title:
                            '${entry.activityType.label} · ${entry.durationMinutes} min',
                        subtitle:
                            '${entry.intensity.label} intensity${entry.distanceKm > 0 ? ' · ${entry.distanceKm} km' : ''}${entry.caloriesBurned > 0 ? ' · ${entry.caloriesBurned.round()} kcal' : ''}',
                      ))
                  .toList(),
              'No cardio recorded for this day.',
            ),
          ],
        ),
      );

  Widget _goalsCard(WellnessProvider provider) => Card(
        child: ExpansionTile(
          title: const Text('Wellness goals',
              style: TextStyle(fontWeight: FontWeight.w700)),
          subtitle: const Text('Daily water, sleep, and cardio targets'),
          childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          children: [
            _numberField(_waterGoalController, 'Daily water (mL)'),
            const SizedBox(height: 10),
            _numberField(_sleepGoalController, 'Nightly sleep (minutes)'),
            const SizedBox(height: 10),
            _numberField(_cardioGoalController, 'Daily cardio (minutes)'),
            const SizedBox(height: 10),
            const Text(
              'General tracking targets only; use professional guidance for personal health needs.',
              style: TextStyle(fontSize: 12),
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: FilledButton(
                onPressed:
                    provider.submitting ? null : () => _saveGoals(provider),
                child: const Text('Save wellness goals'),
              ),
            ),
          ],
        ),
      );

  Widget _numberField(TextEditingController controller, String label,
          {bool decimal = false}) =>
      TextField(
        controller: controller,
        keyboardType: TextInputType.numberWithOptions(decimal: decimal),
        decoration: InputDecoration(labelText: label),
      );

  Widget _heading(String eyebrow, String title, String count) => Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(eyebrow.toUpperCase(),
                    style: TextStyle(
                        fontSize: 11,
                        letterSpacing: 1.2,
                        fontWeight: FontWeight.w800,
                        color: Theme.of(context).colorScheme.primary)),
                Text(title,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Text(count, style: const TextStyle(fontSize: 12)),
        ],
      );

  Widget _entries(List<Widget> children, String emptyText) => Padding(
        padding: const EdgeInsets.only(top: 14),
        child: children.isEmpty
            ? Align(
                alignment: Alignment.centerLeft,
                child: Text(emptyText, style: const TextStyle(fontSize: 13)),
              )
            : Column(children: children),
      );

  Widget _entry({
    required WellnessProvider provider,
    required String kind,
    required String id,
    required String title,
    required String subtitle,
  }) {
    final key = '$kind:$id';
    final confirming = _pendingDelete == key;
    return Column(
      children: [
        const Divider(),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text(subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12)),
                ],
              ),
            ),
            TextButton.icon(
              onPressed: provider.submitting
                  ? null
                  : () => _delete(provider, kind, id),
              icon:
                  Icon(confirming ? Icons.warning_amber : Icons.delete_outline),
              label: Text(confirming ? 'Confirm delete' : 'Delete'),
            ),
          ],
        ),
      ],
    );
  }
}
