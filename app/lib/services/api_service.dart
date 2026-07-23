import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../models/daily_summary.dart';
import '../models/food_entry.dart';
import '../models/macro_goal.dart';
import '../models/user.dart';
import '../models/wellness.dart';
import '../models/weekly_summary.dart';
import 'token_store.dart';

/// Thrown for any non-2xx API response, carrying the backend's message.
/// The backend always returns errors as { "message": "..." }.
class ApiException implements Exception {
  final int? statusCode;
  final String message;
  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

/// Result of a successful login: the JWT plus the user.
class AuthResult {
  final String token;
  final User user;
  const AuthResult(this.token, this.user);
}

/// Single place that talks to the MacroVanta backend.
///
/// A Dio interceptor automatically attaches `Authorization: Bearer <token>`
/// to every request when a token is stored, so individual calls don't worry
/// about auth headers.
class ApiService {
  final Dio _dio;
  final TokenStore _tokenStore;

  ApiService({TokenStore? tokenStore})
      : _tokenStore = tokenStore ?? TokenStore(),
        _dio = Dio(
          BaseOptions(
            baseUrl: ApiConfig.apiBase,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            contentType: 'application/json',
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenStore.readToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  /// Converts DioExceptions into clean ApiExceptions carrying the backend
  /// message where available.
  Never _rethrowAsApi(DioException e) {
    final data = e.response?.data;
    String message;
    if (data is Map && data['message'] is String) {
      message = data['message'] as String;
    } else if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError) {
      message = 'Could not reach the server. Check your connection.';
    } else {
      message = 'Something went wrong. Please try again.';
    }
    throw ApiException(e.response?.statusCode, message);
  }

  // ---------------------------------------------------------------- Auth

  /// POST /api/auth/login -> { token, user }
  /// Note: backend returns 403 if the email isn't verified.
  Future<AuthResult> login(String email, String password) async {
    try {
      final res = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      final token = res.data['token'] as String;
      final user = User.fromJson(res.data['user'] as Map<String, dynamic>);
      await _tokenStore.saveToken(token);
      return AuthResult(token, user);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// POST /api/auth/register -> { message, user }
  /// Note: register does NOT return a token, so callers should log in
  /// afterward to obtain one. The backend enforces password complexity.
  Future<void> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    try {
      await _dio.post('/auth/register', data: {
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
      });
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<String> resendVerification(String email) async {
    try {
      final res = await _dio.post('/auth/resend-verification', data: {
        'email': email,
      });
      return res.data['message'] as String? ?? 'Verification email sent.';
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<String> forgotPassword(String email) async {
    try {
      final res = await _dio.post('/auth/forgot-password', data: {
        'email': email,
      });
      return res.data['message'] as String? ??
          'If that email exists, a password reset link was sent.';
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// GET /api/auth/me -> { user }. Used on app start to restore the session.
  Future<User> getMe() async {
    try {
      final res = await _dio.get('/auth/me');
      return User.fromJson(res.data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<void> logout() async {
    // JWT logout is client-side: just drop the token. We still hit the
    // endpoint for completeness but don't depend on it.
    try {
      await _dio.post('/auth/logout');
    } on DioException {
      // ignore network errors on logout
    }
    await _tokenStore.clear();
  }

  // ---------------------------------------------------------------- Foods

  /// GET /api/foods?date=YYYY-MM-DD -> { foodEntries: [...] }
  Future<List<FoodEntry>> getFoods(String date) async {
    try {
      final res = await _dio.get('/foods', queryParameters: {'date': date});
      final list =
          (res.data['foodEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(FoodEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// POST /api/foods -> { foodEntry: {...} }
  Future<FoodEntry> createFood(FoodEntryInput input) async {
    try {
      final res = await _dio.post('/foods', data: input.toJson());
      return FoodEntry.fromJson(res.data['foodEntry'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// PUT /api/foods/:id -> { foodEntry: {...} }
  Future<FoodEntry> updateFood(String id, FoodEntryInput input) async {
    try {
      final res = await _dio.put('/foods/$id', data: input.toJson());
      return FoodEntry.fromJson(res.data['foodEntry'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// DELETE /api/foods/:id
  Future<void> deleteFood(String id) async {
    try {
      await _dio.delete('/foods/$id');
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// GET /api/foods/search?query=... -> { foodEntries: [...] }
  Future<List<FoodEntry>> searchFoods(String query) async {
    try {
      final res =
          await _dio.get('/foods/search', queryParameters: {'query': query});
      final list =
          (res.data['foodEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(FoodEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// GET /api/preset-foods/search -> verified USDA FoodData Central servings.
  /// The device calls our authenticated Express endpoint so the USDA API key,
  /// validation, and rate limiting remain server-side.
  Future<List<PresetFood>> searchPresetFoods(
    String query, {
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      final res = await _dio.get(
        '/preset-foods/search',
        queryParameters: {
          'query': query,
          'page': page,
          'pageSize': pageSize,
        },
        // The backend proxies USDA FoodData Central (up to ~10s) before
        // responding, so give this call more headroom than the default 15s.
        options: Options(receiveTimeout: const Duration(seconds: 20)),
      );
      final list = res.data['foods'] as List;
      return list
          .map(
            (food) => PresetFood.fromJson(
              Map<String, dynamic>.from(food as Map),
            ),
          )
          .toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// GET /api/foods/recent -> { foodEntries: [...] }
  Future<List<FoodEntry>> getRecentFoods() async {
    try {
      final res = await _dio.get('/foods/recent');
      final list =
          (res.data['foodEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(FoodEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// POST /api/foods/quick-add/:id -> { foodEntry: {...} }
  /// Re-logs a recent food for [date]. If [mealType] is null the backend
  /// reuses the source entry's meal.
  Future<FoodEntry> quickAddFood(
    String id,
    String date, {
    MealType? mealType,
  }) async {
    try {
      final body = <String, dynamic>{'date': date};
      if (mealType != null) body['mealType'] = mealType.label;
      final res = await _dio.post('/foods/quick-add/$id', data: body);
      return FoodEntry.fromJson(res.data['foodEntry'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// POST /api/foods/ai-log -> validated, estimated food entries.
  Future<List<FoodEntry>> logFoodWithAi({
    required String text,
    required String date,
    required MealType mealType,
  }) async {
    try {
      final res = await _dio.post(
        '/foods/ai-log',
        data: {
          'text': text,
          'date': date,
          'mealType': mealType.label,
        },
        // The backend calls an LLM (up to ~20s) and then writes the entries
        // before responding, so this one route needs a longer ceiling than the
        // default 15s. Timing out early here shows a false "can't reach server"
        // even though the food was logged, and a retry would double-log it.
        options: Options(receiveTimeout: const Duration(seconds: 35)),
      );
      final list =
          (res.data['foodEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(FoodEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  // ---------------------------------------------------------------- Goals

  /// GET /api/goals -> { goals: {...} } or { goals: null } if never set.
  Future<MacroGoal?> getGoals() async {
    try {
      final res = await _dio.get('/goals');
      final goals = res.data['goals'];
      if (goals == null) return null;
      return MacroGoal.fromJson(goals as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// PUT /api/goals -> { message, goals: {...} }
  Future<MacroGoal> saveGoals(MacroGoalInput input) async {
    try {
      final res = await _dio.put('/goals', data: input.toJson());
      return MacroGoal.fromJson(res.data['goals'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  // -------------------------------------------------------------- Summary

  /// GET /api/summary/daily?date=... -> totals, goals, progress.
  Future<DailySummary> getDailySummary(String date) async {
    try {
      final res =
          await _dio.get('/summary/daily', queryParameters: {'date': date});
      return DailySummary.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// GET /api/summary/weekly?startDate=... -> { startDate, endDate, days }.
  /// The server returns 7 days counting forward from startDate.
  Future<WeeklySummary> getWeeklySummary(String startDate) async {
    try {
      final res = await _dio
          .get('/summary/weekly', queryParameters: {'startDate': startDate});
      return WeeklySummary.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  // -------------------------------------------------------------- Wellness

  Future<WellnessSummary> getWellnessSummary(String date) async {
    try {
      final res =
          await _dio.get('/wellness/summary', queryParameters: {'date': date});
      return WellnessSummary.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<List<WaterEntry>> getWaterEntries(String date) async {
    try {
      final res =
          await _dio.get('/wellness/water', queryParameters: {'date': date});
      final list =
          (res.data['waterEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(WaterEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<WaterEntry> createWaterEntry(int amountMl, String date) async {
    try {
      final res = await _dio.post('/wellness/water', data: {
        'amountMl': amountMl,
        'date': date,
      });
      return WaterEntry.fromJson(
          res.data['waterEntry'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<void> deleteWaterEntry(String id) async {
    try {
      await _dio.delete('/wellness/water/$id');
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<List<CardioEntry>> getCardioEntries(String date) async {
    try {
      final res =
          await _dio.get('/wellness/cardio', queryParameters: {'date': date});
      final list =
          (res.data['cardioEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(CardioEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<CardioEntry> createCardioEntry(CardioEntryInput input) async {
    try {
      final res = await _dio.post('/wellness/cardio', data: input.toJson());
      return CardioEntry.fromJson(
          res.data['cardioEntry'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<void> deleteCardioEntry(String id) async {
    try {
      await _dio.delete('/wellness/cardio/$id');
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<List<SleepEntry>> getSleepEntries(String date) async {
    try {
      final res =
          await _dio.get('/wellness/sleep', queryParameters: {'date': date});
      final list =
          (res.data['sleepEntries'] as List).cast<Map<String, dynamic>>();
      return list.map(SleepEntry.fromJson).toList();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<SleepEntry> createSleepEntry(SleepEntryInput input) async {
    try {
      final res = await _dio.post('/wellness/sleep', data: input.toJson());
      return SleepEntry.fromJson(
          res.data['sleepEntry'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<void> deleteSleepEntry(String id) async {
    try {
      await _dio.delete('/wellness/sleep/$id');
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  Future<WellnessGoal> saveWellnessGoals(WellnessGoal goals) async {
    try {
      final res = await _dio.put('/wellness/goals', data: goals.toJson());
      return WellnessGoal.fromJson(res.data['goals'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  // ----------------------------------------------------------------- Profile

  /// PUT /api/users/profile -> { message, user }
  Future<User> updateProfile({String? firstName, String? lastName}) async {
    try {
      final body = <String, dynamic>{};
      if (firstName != null) body['firstName'] = firstName;
      if (lastName != null) body['lastName'] = lastName;
      final res = await _dio.put('/users/profile', data: body);
      return User.fromJson(res.data['user'] as Map<String, dynamic>);
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// PUT /api/users/password -> { message }
  /// Backend requires the new password to meet complexity rules.
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _dio.put('/users/password', data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      });
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }

  /// DELETE /api/users/account -> { message }
  /// Permanently removes the account and all associated data.
  Future<void> deleteAccount() async {
    try {
      await _dio.delete('/users/account');
      await _tokenStore.clear();
    } on DioException catch (e) {
      _rethrowAsApi(e);
    }
  }
}
