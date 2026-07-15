import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/api_service.dart';
import '../services/token_store.dart';

/// Where the app is in the auth lifecycle.
enum AuthStatus {
  unknown,        // still checking for a stored session on startup
  authenticated,
  unauthenticated,
}

/// App-wide authentication state.
///
/// This is the single source of truth for "who is logged in". Screens read
/// [status] and [user] and call [login] / [logout]. It notifies listeners on
/// every change so the UI rebuilds automatically.
class AuthProvider extends ChangeNotifier {
  final ApiService _api;
  final TokenStore _tokenStore;

  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _errorMessage;
  bool _busy = false;

  AuthProvider({ApiService? api, TokenStore? tokenStore})
      : _api = api ?? ApiService(),
        _tokenStore = tokenStore ?? TokenStore();

  AuthStatus get status => _status;
  User? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get busy => _busy;

  /// Call once at startup. If a stored token still validates, restore the
  /// session; otherwise land on the login screen.
  Future<void> loadSession() async {
    final token = await _tokenStore.readToken();
    if (token == null || token.isEmpty) {
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }
    try {
      _user = await _api.getMe();
      _status = AuthStatus.authenticated;
    } catch (_) {
      // Token invalid/expired — clear it and require login.
      await _tokenStore.clear();
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  /// Returns true on success. On failure sets [errorMessage].
  Future<bool> login(String email, String password) async {
    _busy = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final result = await _api.login(email, password);
      _user = result.user;
      _status = AuthStatus.authenticated;
      _busy = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.logout();
    _user = null;
    _status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  /// Register a new account, then automatically log in with the same
  /// credentials (the deployed server allows unverified logins). Returns true
  /// on success; on failure sets [errorMessage].
  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
  }) async {
    _busy = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await _api.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      );
      // Register returns no token, so log in to obtain one.
      final result = await _api.login(email, password);
      _user = result.user;
      _status = AuthStatus.authenticated;
      _busy = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  /// Update the user's name. Returns true on success and refreshes [user]
  /// so the new name shows everywhere immediately.
  Future<bool> updateProfile({String? firstName, String? lastName}) async {
    try {
      _user = await _api.updateProfile(
        firstName: firstName,
        lastName: lastName,
      );
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    }
  }

  /// Change password. Returns null on success, or an error message on failure.
  Future<String?> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _api.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      return null;
    } on ApiException catch (e) {
      return e.message;
    }
  }

  /// Permanently delete the account, then drop to the unauthenticated state.
  /// Returns true on success.
  Future<bool> deleteAccount() async {
    try {
      await _api.deleteAccount();
      _user = null;
      _status = AuthStatus.unauthenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    }
  }
}
