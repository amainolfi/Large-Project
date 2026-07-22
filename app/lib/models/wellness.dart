enum ActivityType {
  walking('walking', 'Walking'),
  running('running', 'Running'),
  cycling('cycling', 'Cycling'),
  swimming('swimming', 'Swimming'),
  elliptical('elliptical', 'Elliptical'),
  rowing('rowing', 'Rowing'),
  sports('sports', 'Sports'),
  other('other', 'Other');

  final String value;
  final String label;
  const ActivityType(this.value, this.label);

  static ActivityType fromValue(String? value) =>
      ActivityType.values.firstWhere(
        (entry) => entry.value == value,
        orElse: () => ActivityType.other,
      );
}

enum Intensity {
  low('low', 'Low'),
  moderate('moderate', 'Moderate'),
  high('high', 'High');

  final String value;
  final String label;
  const Intensity(this.value, this.label);

  static Intensity fromValue(String? value) => Intensity.values.firstWhere(
        (entry) => entry.value == value,
        orElse: () => Intensity.moderate,
      );
}

enum SleepQuality {
  poor('poor', 'Poor'),
  fair('fair', 'Fair'),
  good('good', 'Good'),
  excellent('excellent', 'Excellent');

  final String value;
  final String label;
  const SleepQuality(this.value, this.label);

  static SleepQuality fromValue(String? value) =>
      SleepQuality.values.firstWhere(
        (entry) => entry.value == value,
        orElse: () => SleepQuality.good,
      );
}

double _number(dynamic value) => (value as num?)?.toDouble() ?? 0;
int _integer(dynamic value) => (value as num?)?.toInt() ?? 0;

class CardioEntry {
  final String id;
  final ActivityType activityType;
  final int durationMinutes;
  final double distanceKm;
  final double caloriesBurned;
  final Intensity intensity;
  final String notes;
  final String date;
  final String? createdAt;
  final String? updatedAt;

  const CardioEntry({
    required this.id,
    required this.activityType,
    required this.durationMinutes,
    required this.distanceKm,
    required this.caloriesBurned,
    required this.intensity,
    required this.notes,
    required this.date,
    this.createdAt,
    this.updatedAt,
  });

  factory CardioEntry.fromJson(Map<String, dynamic> json) => CardioEntry(
        id: json['id'] as String? ?? '',
        activityType: ActivityType.fromValue(json['activityType'] as String?),
        durationMinutes: _integer(json['durationMinutes']),
        distanceKm: _number(json['distanceKm']),
        caloriesBurned: _number(json['caloriesBurned']),
        intensity: Intensity.fromValue(json['intensity'] as String?),
        notes: json['notes'] as String? ?? '',
        date: json['date'] as String? ?? '',
        createdAt: json['createdAt'] as String?,
        updatedAt: json['updatedAt'] as String?,
      );
}

class CardioEntryInput {
  final ActivityType activityType;
  final int durationMinutes;
  final double distanceKm;
  final double caloriesBurned;
  final Intensity intensity;
  final String notes;
  final String date;

  const CardioEntryInput({
    required this.activityType,
    required this.durationMinutes,
    this.distanceKm = 0,
    this.caloriesBurned = 0,
    this.intensity = Intensity.moderate,
    this.notes = '',
    required this.date,
  });

  Map<String, dynamic> toJson() => {
        'activityType': activityType.value,
        'durationMinutes': durationMinutes,
        'distanceKm': distanceKm,
        'caloriesBurned': caloriesBurned,
        'intensity': intensity.value,
        'notes': notes,
        'date': date,
      };
}

class WaterEntry {
  final String id;
  final int amountMl;
  final String date;
  final String? createdAt;
  final String? updatedAt;

  const WaterEntry({
    required this.id,
    required this.amountMl,
    required this.date,
    this.createdAt,
    this.updatedAt,
  });

  factory WaterEntry.fromJson(Map<String, dynamic> json) => WaterEntry(
        id: json['id'] as String? ?? '',
        amountMl: _integer(json['amountMl']),
        date: json['date'] as String? ?? '',
        createdAt: json['createdAt'] as String?,
        updatedAt: json['updatedAt'] as String?,
      );
}

class SleepEntry {
  final String id;
  final int durationMinutes;
  final SleepQuality quality;
  final String notes;
  final String date;
  final String? createdAt;
  final String? updatedAt;

  const SleepEntry({
    required this.id,
    required this.durationMinutes,
    required this.quality,
    required this.notes,
    required this.date,
    this.createdAt,
    this.updatedAt,
  });

  factory SleepEntry.fromJson(Map<String, dynamic> json) => SleepEntry(
        id: json['id'] as String? ?? '',
        durationMinutes: _integer(json['durationMinutes']),
        quality: SleepQuality.fromValue(json['quality'] as String?),
        notes: json['notes'] as String? ?? '',
        date: json['date'] as String? ?? '',
        createdAt: json['createdAt'] as String?,
        updatedAt: json['updatedAt'] as String?,
      );
}

class SleepEntryInput {
  final int durationMinutes;
  final SleepQuality quality;
  final String notes;
  final String date;

  const SleepEntryInput({
    required this.durationMinutes,
    this.quality = SleepQuality.good,
    this.notes = '',
    required this.date,
  });

  Map<String, dynamic> toJson() => {
        'durationMinutes': durationMinutes,
        'quality': quality.value,
        'notes': notes,
        'date': date,
      };
}

class WellnessGoal {
  final String? id;
  final int dailyWaterMl;
  final int nightlySleepMinutes;
  final int weeklyCardioMinutes;

  const WellnessGoal({
    this.id,
    required this.dailyWaterMl,
    required this.nightlySleepMinutes,
    required this.weeklyCardioMinutes,
  });

  factory WellnessGoal.fromJson(Map<String, dynamic> json) => WellnessGoal(
        id: json['id'] as String?,
        dailyWaterMl: _integer(json['dailyWaterMl']),
        nightlySleepMinutes: _integer(json['nightlySleepMinutes']),
        weeklyCardioMinutes: _integer(json['weeklyCardioMinutes']),
      );

  Map<String, dynamic> toJson() => {
        'dailyWaterMl': dailyWaterMl,
        'nightlySleepMinutes': nightlySleepMinutes,
        'weeklyCardioMinutes': weeklyCardioMinutes,
      };
}

class WellnessSummary {
  final String date;
  final int waterMl;
  final int sleepMinutes;
  final int cardioMinutes;
  final double cardioCaloriesBurned;
  final String weekStartDate;
  final String weekEndDate;
  final int weeklyCardioMinutes;
  final WellnessGoal goals;
  final double waterPercent;
  final double sleepPercent;
  final double weeklyCardioPercent;

  const WellnessSummary({
    required this.date,
    required this.waterMl,
    required this.sleepMinutes,
    required this.cardioMinutes,
    required this.cardioCaloriesBurned,
    required this.weekStartDate,
    required this.weekEndDate,
    required this.weeklyCardioMinutes,
    required this.goals,
    required this.waterPercent,
    required this.sleepPercent,
    required this.weeklyCardioPercent,
  });

  factory WellnessSummary.fromJson(Map<String, dynamic> json) {
    final totals = json['totals'] as Map<String, dynamic>? ?? {};
    final weekly = json['weekly'] as Map<String, dynamic>? ?? {};
    final progress = json['progress'] as Map<String, dynamic>? ?? {};
    final goals = json['goals'] as Map<String, dynamic>? ?? {};

    return WellnessSummary(
      date: json['date'] as String? ?? '',
      waterMl: _integer(totals['waterMl']),
      sleepMinutes: _integer(totals['sleepMinutes']),
      cardioMinutes: _integer(totals['cardioMinutes']),
      cardioCaloriesBurned: _number(totals['cardioCaloriesBurned']),
      weekStartDate: weekly['startDate'] as String? ?? '',
      weekEndDate: weekly['endDate'] as String? ?? '',
      weeklyCardioMinutes: _integer(weekly['cardioMinutes']),
      goals: WellnessGoal.fromJson(goals),
      waterPercent: _number(progress['waterPercent']),
      sleepPercent: _number(progress['sleepPercent']),
      weeklyCardioPercent: _number(progress['weeklyCardioPercent']),
    );
  }
}
