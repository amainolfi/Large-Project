import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:macrovanta/config/app_theme.dart';
import 'package:macrovanta/models/daily_summary.dart';
import 'package:macrovanta/models/food_entry.dart';
import 'package:macrovanta/models/macro_goal.dart';
import 'package:macrovanta/models/weekly_summary.dart';
import 'package:macrovanta/models/wellness.dart';
import 'package:macrovanta/providers/dashboard_provider.dart';
import 'package:macrovanta/providers/food_entry_provider.dart';
import 'package:macrovanta/screens/home_shell.dart';
import 'package:macrovanta/services/api_service.dart';
import 'package:macrovanta/widgets/food_entry_form.dart';
import 'package:macrovanta/widgets/macro_progress_bar.dart';
import 'package:macrovanta/widgets/meal_section.dart';
import 'package:macrovanta/widgets/weekly_macro_chart.dart';

class _RecordingFoodApi extends ApiService {
  FoodEntryInput? createdInput;

  @override
  Future<FoodEntry> createFood(FoodEntryInput input) async {
    createdInput = input;
    return FoodEntry.fromJson({'id': 'created-food', ...input.toJson()});
  }

  @override
  Future<DailySummary> getDailySummary(String date) async {
    return DailySummary.fromJson({'date': date});
  }

  @override
  Future<List<FoodEntry>> getFoods(String date) async => [];
}

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
        'sugar': 14.4,
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
      expect(entry.sugar, 14.4);
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
        sugar: 17,
        calcium: 200,
        vitaminD: 2,
        date: '2026-07-21',
      );

      expect(input.toJson()['mealType'], 'Breakfast');
      expect(input.toJson()['sugar'], 17);
      expect(input.toJson()['calcium'], 200);
      expect(input.toJson()['vitaminD'], 2);
      expect(input.toJson()['source'], 'manual');
    });

    test('converts a verified USDA result into a complete food entry', () {
      final preset = PresetFood.fromJson({
        'fdcId': 173944,
        'foodName': 'Banana, raw',
        'brand': null,
        'dataType': 'SR Legacy',
        'servingSize': '100 g',
        'calories': 89,
        'protein': 1.1,
        'carbs': 22.8,
        'fat': 0.3,
        'saturatedFat': 0.1,
        'transFat': 0,
        'fiber': 2.6,
        'sugar': 12.2,
        'sodium': 1,
        'potassium': 358,
        'calcium': 5,
        'iron': 0.3,
        'vitaminC': 8.7,
        'vitaminD': 0,
      });
      final input = preset.toFoodEntryInput(
        mealType: MealType.lunch,
        date: '2026-07-23',
      );

      expect(preset.fdcId, 173944);
      expect(input.foodName, 'Banana, raw');
      expect(input.source, FoodSource.usda);
      expect(input.mealType, MealType.lunch);
      expect(input.sugar, 12.2);
      expect(input.potassium, 358);
      expect(input.toJson()['source'], 'usda');
    });
  });

  test('summary and goal models default missing legacy nutrients to zero', () {
    final nutrients = NutrientSet.fromJson({'calories': 400, 'protein': 25});
    final goals = MacroGoal.fromJson({'id': 'goal-1', 'dailyCalories': 2000});

    expect(nutrients.fat, 0);
    expect(nutrients.sugar, 0);
    expect(nutrients.potassium, 0);
    expect(goals.dailyFiber, 0);
    expect(goals.dailySugar, 0);
    expect(goals.dailyVitaminD, 0);
  });

  group('wellness API contract', () {
    test('parses daily wellness progress', () {
      final summary = WellnessSummary.fromJson({
        'date': '2026-07-21',
        'totals': {
          'waterMl': 1250,
          'sleepMinutes': 450,
          'cardioMinutes': 30,
          'cardioCaloriesBurned': 320,
        },
        'goals': {
          'dailyWaterMl': 2500,
          'nightlySleepMinutes': 480,
          'dailyCardioMinutes': 30,
        },
        'progress': {
          'waterPercent': 50,
          'sleepPercent': 93.8,
          'cardioPercent': 100,
        },
      });

      expect(summary.waterMl, 1250);
      expect(summary.sleepMinutes, 450);
      expect(summary.cardioMinutes, 30);
      expect(summary.cardioPercent, 100);
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
        dailyCardioMinutes: 30,
      );

      expect(water.amountMl, 500);
      expect(goals.toJson()['dailyCardioMinutes'], 30);
    });
  });

  testWidgets('food delete invokes its callback on the first tap',
      (tester) async {
    var deleteCount = 0;
    const entry = FoodEntry(
      id: 'food-1',
      foodName: 'Greek yogurt',
      servingSize: '1 cup',
      mealType: MealType.breakfast,
      calories: 150,
      protein: 12,
      carbs: 18,
      fat: 4,
      saturatedFat: 2,
      transFat: 0,
      sugar: 12,
      fiber: 0,
      sodium: 70,
      potassium: 240,
      calcium: 200,
      iron: 0,
      vitaminC: 0,
      vitaminD: 2,
      source: FoodSource.manual,
      date: '2026-07-27',
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: MealSection(
            meal: MealType.breakfast,
            entries: const [entry],
            totalCalories: entry.calories,
            onEdit: (_) {},
            onDelete: (_) => deleteCount += 1,
          ),
        ),
      ),
    );

    expect(find.text('Confirm delete'), findsNothing);
    await tester.tap(find.text('Delete'));
    expect(deleteCount, 1);
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

  test('dark theme uses the shared midnight and indigo brand tokens', () {
    final theme = AppTheme.dark;

    expect(theme.scaffoldBackgroundColor, AppTheme.background);
    expect(theme.cardTheme.color, AppTheme.card);
    expect(theme.navigationBarTheme.backgroundColor, AppTheme.navbar);
    expect(theme.colorScheme.primary, AppTheme.primary);
    expect(theme.colorScheme.outline, AppTheme.border);
    expect(theme.colorScheme.onSurface, AppTheme.primaryText);
    expect(theme.colorScheme.onSurfaceVariant, AppTheme.mutedText);
  });

  testWidgets('progress bars stay purple through target and turn red only over',
      (tester) async {
    Future<Color?> progressColor(double percent) async {
      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.dark,
          home: Scaffold(
            body: MacroProgressBar(
              label: 'Water',
              value: percent,
              goal: 100,
              percent: percent,
              unit: 'mL',
            ),
          ),
        ),
      );
      final indicator = tester.widget<LinearProgressIndicator>(
          find.byType(LinearProgressIndicator));
      return indicator.valueColor!.value;
    }

    expect(await progressColor(50), AppTheme.primary);
    expect(await progressColor(100), AppTheme.primary);
    expect(await progressColor(101), AppTheme.dark.colorScheme.error);
  });

  test('mobile navigation keeps Add Food and uses the required tab order', () {
    expect(
      homeNavigationLabels,
      const [
        'Dashboard',
        'Add Food',
        'Macros',
        'History',
        'Wellness',
        'Profile',
      ],
    );
  });

  testWidgets('manual food logging follows the latest selected dashboard date',
      (tester) async {
    final api = _RecordingFoodApi();
    var selectedDate = '2026-07-27';
    late StateSetter updateDate;

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(
            create: (_) => DashboardProvider(api: api),
          ),
          ChangeNotifierProvider(
            create: (_) => FoodEntryProvider(api: api),
          ),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: StatefulBuilder(
                builder: (context, setState) {
                  updateDate = setState;
                  return FoodEntryForm(selectedDate: selectedDate);
                },
              ),
            ),
          ),
        ),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Food name'),
      'Forgotten oatmeal',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Serving size'),
      '1 bowl',
    );

    updateDate(() => selectedDate = '2026-07-20');
    await tester.pump();

    final addButton = find.widgetWithText(FilledButton, 'Add food');
    await tester.ensureVisible(addButton);
    await tester.tap(addButton);
    await tester.pumpAndSettle();

    expect(api.createdInput?.date, '2026-07-20');
  });

  testWidgets(
      'weekly macro chart averages tracked days and exposes empty states',
      (tester) async {
    NutrientSet nutrients({
      double calories = 0,
      double protein = 0,
      double carbs = 0,
      double fat = 0,
    }) {
      return NutrientSet(
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        saturatedFat: 0,
        transFat: 0,
        sugar: 0,
        fiber: 0,
        sodium: 0,
        potassium: 0,
        calcium: 0,
        iron: 0,
        vitaminC: 0,
        vitaminD: 0,
      );
    }

    final days = [
      DayTotals(
        date: '2026-07-19',
        totals: nutrients(
          calories: 2000,
          protein: 100,
          carbs: 200,
          fat: 60,
        ),
      ),
      DayTotals(
        date: '2026-07-20',
        totals: nutrients(
          calories: 2400,
          protein: 140,
          carbs: 260,
          fat: 80,
        ),
      ),
      DayTotals(date: '2026-07-21', totals: nutrients()),
    ];
    final goals = MacroGoal.fromJson({
      'id': 'goal-1',
      'dailyCalories': 2200,
      'dailyProtein': 150,
      'dailyCarbs': 250,
      'dailyFat': 75,
    });

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.dark,
        home: Scaffold(
          body: SingleChildScrollView(
            child: WeeklyMacroChart(days: days, goals: goals),
          ),
        ),
      ),
    );

    expect(find.text('2 of 3 days tracked'), findsOneWidget);
    expect(find.textContaining('120 g average'), findsOneWidget);
    expect(find.textContaining('230 g average'), findsOneWidget);
    expect(find.textContaining('70 g average'), findsOneWidget);
    expect(find.text('No data'), findsOneWidget);
    expect(find.text('Calorie share'), findsNothing);
    expect(find.text('Grams'), findsNothing);
    expect(
      find.byTooltip(
        'Sun, Jul 19\n'
        'Protein: 100 g\n'
        'Target: 150 g (66.7%)',
      ),
      findsOneWidget,
    );

    expect(
      find.textContaining('Target markers use your saved daily protein'),
      findsOneWidget,
    );
  });
}
