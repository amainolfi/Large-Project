import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:macrovanta/config/app_theme.dart';
import 'package:macrovanta/models/daily_summary.dart';
import 'package:macrovanta/models/food_entry.dart';
import 'package:macrovanta/models/macro_goal.dart';
import 'package:macrovanta/models/wellness.dart';
import 'package:macrovanta/widgets/macro_progress_bar.dart';

void main() {
  group('food entry contract', () {
    test('parses every macro and micronutrient from API JSON', () {
      final entry = FoodEntry.fromJson({
        'id': 'food-1',
        'foodName': 'Banana',
        'servingSize': '1 medium',
        'mealType': 'Lunch',
        'calories': 105,
        'protein': 1.3,
        'carbs': 27,
        'fat': 0.4,
        'saturatedFat': 0.1,
        'transFat': 0,
        'fiber': 3.1,
        'sodium': 1,
        'potassium': 422,
        'calcium': 6,
        'iron': 0.3,
        'vitaminC': 10.3,
        'vitaminD': 0,
        'source': 'ai',
        'confidence': 'high',
        'date': '2026-07-21',
      });

      expect(entry.mealType, MealType.lunch);
      expect(entry.source, FoodSource.ai);
      expect(entry.fiber, 3.1);
      expect(entry.potassium, 422);
      expect(entry.vitaminC, 10.3);
    });

    test('serializes micronutrients for create and update requests', () {
      const input = FoodEntryInput(
        foodName: 'Yogurt',
        servingSize: '1 cup',
        mealType: MealType.breakfast,
        calories: 150,
        protein: 12,
        carbs: 18,
        fat: 4,
        calcium: 200,
        vitaminD: 2,
        date: '2026-07-21',
      );

      expect(input.toJson()['mealType'], 'Breakfast');
      expect(input.toJson()['calcium'], 200);
      expect(input.toJson()['vitaminD'], 2);
      expect(input.toJson()['source'], 'manual');
    });
  });

  test('summary and goal models default missing legacy nutrients to zero', () {
    final nutrients = NutrientSet.fromJson({'calories': 400, 'protein': 25});
    final goals = MacroGoal.fromJson({'id': 'goal-1', 'dailyCalories': 2000});

    expect(nutrients.fat, 0);
    expect(nutrients.potassium, 0);
    expect(goals.dailyFiber, 0);
    expect(goals.dailyVitaminD, 0);
  });

  group('wellness API contract', () {
    test('parses daily and weekly wellness progress', () {
      final summary = WellnessSummary.fromJson({
        'date': '2026-07-21',
        'totals': {
          'waterMl': 1250,
          'sleepMinutes': 450,
          'cardioMinutes': 30,
          'cardioCaloriesBurned': 320,
        },
        'weekly': {
          'startDate': '2026-07-20',
          'endDate': '2026-07-26',
          'cardioMinutes': 75,
        },
        'goals': {
          'dailyWaterMl': 2500,
          'nightlySleepMinutes': 480,
          'weeklyCardioMinutes': 150,
        },
        'progress': {
          'waterPercent': 50,
          'sleepPercent': 93.8,
          'weeklyCardioPercent': 50,
        },
      });

      expect(summary.waterMl, 1250);
      expect(summary.sleepMinutes, 450);
      expect(summary.weeklyCardioMinutes, 75);
      expect(summary.sleepPercent, 93.8);
      expect(summary.goals.nightlySleepMinutes, 480);
    });

    test('serializes cardio and sleep records with API enum values', () {
      const cardio = CardioEntryInput(
        activityType: ActivityType.running,
        durationMinutes: 30,
        distanceKm: 5,
        caloriesBurned: 320,
        intensity: Intensity.high,
        notes: '5K',
        date: '2026-07-21',
      );
      const sleep = SleepEntryInput(
        durationMinutes: 480,
        quality: SleepQuality.excellent,
        date: '2026-07-21',
      );

      expect(cardio.toJson()['activityType'], 'running');
      expect(cardio.toJson()['intensity'], 'high');
      expect(sleep.toJson()['quality'], 'excellent');
      expect(sleep.toJson()['durationMinutes'], 480);
    });

    test('parses water entries and serializes wellness goals', () {
      final water = WaterEntry.fromJson({
        'id': 'water-1',
        'amountMl': 500,
        'date': '2026-07-21',
      });
      const goals = WellnessGoal(
        dailyWaterMl: 2500,
        nightlySleepMinutes: 480,
        weeklyCardioMinutes: 150,
      );

      expect(water.amountMl, 500);
      expect(goals.toJson()['weeklyCardioMinutes'], 150);
    });
  });

  testWidgets('progress component renders in both light and dark themes',
      (tester) async {
    Widget app(ThemeData theme) => MaterialApp(
          theme: theme,
          home: const Scaffold(
            body: MacroProgressBar(
              label: 'Protein',
              value: 75,
              goal: 150,
              percent: 50,
              unit: 'g',
            ),
          ),
        );

    await tester.pumpWidget(app(AppTheme.light));
    expect(find.text('Protein'), findsOneWidget);
    expect(find.text('50%'), findsOneWidget);

    await tester.pumpWidget(app(AppTheme.dark));
    expect(find.textContaining('75 g', findRichText: true), findsOneWidget);
  });
}
