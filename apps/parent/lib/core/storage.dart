import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService([FlutterSecureStorage? storage])
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
            );

  Future<void> saveAuthToken(String token) async {
    await _storage.write(key: AppConstants.keyAuthToken, value: token);
  }

  Future<String?> getAuthToken() async {
    return await _storage.read(key: AppConstants.keyAuthToken);
  }

  Future<void> saveSelectedSchool(String schoolId) async {
    await _storage.write(key: AppConstants.keySelectedSchoolId, value: schoolId);
  }

  Future<String?> getSelectedSchool() async {
    return await _storage.read(key: AppConstants.keySelectedSchoolId);
  }

  Future<void> saveSelectedChild(String childId) async {
    await _storage.write(key: AppConstants.keySelectedChildId, value: childId);
  }

  Future<String?> getSelectedChild() async {
    return await _storage.read(key: AppConstants.keySelectedChildId);
  }

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
