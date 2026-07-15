import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Wraps secure, platform-backed storage for the JWT.
/// On iOS this uses the Keychain; on Android, EncryptedSharedPreferences.
/// Never store the token in plain SharedPreferences.
class TokenStore {
  static const _tokenKey = 'mv_auth_token';
  final FlutterSecureStorage _storage;

  TokenStore([FlutterSecureStorage? storage])
      : _storage = storage ?? const FlutterSecureStorage();

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenKey, value: token);

  Future<String?> readToken() => _storage.read(key: _tokenKey);

  Future<void> clear() => _storage.delete(key: _tokenKey);
}
