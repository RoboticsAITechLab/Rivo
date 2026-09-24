import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../core/constants.dart';
import '../core/storage.dart';
import '../models/user.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage: storage);
});

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final bool mfaRequired;
  final String? mfaChallengeToken;
  final UserModel? user;
  final List<SchoolModel> schools;
  final SchoolModel? activeSchool;
  final String? errorMessage;

  AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.mfaRequired = false,
    this.mfaChallengeToken,
    this.user,
    this.schools = const [],
    this.activeSchool,
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    bool? mfaRequired,
    String? mfaChallengeToken,
    UserModel? user,
    List<SchoolModel>? schools,
    SchoolModel? activeSchool,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      mfaRequired: mfaRequired ?? this.mfaRequired,
      mfaChallengeToken: mfaChallengeToken ?? this.mfaChallengeToken,
      user: user ?? this.user,
      schools: schools ?? this.schools,
      activeSchool: activeSchool ?? this.activeSchool,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _client;
  final SecureStorageService _storage;

  AuthNotifier(this._client, this._storage) : super(AuthState()) {
    checkInitialSession();
  }

  Future<void> checkInitialSession() async {
    final token = await _storage.getAuthToken();
    if (token == null || token.isEmpty) return;

    state = state.copyWith(isLoading: true);
    try {
      final res = await _client.dio.get(AppConstants.endpointParentMe);
      if (res.statusCode == 200 && res.data['success'] == true) {
        final data = res.data['data'];
        final user = UserModel.fromJson(data['user']);
        final schools = (data['schools'] as List<dynamic>)
            .map((s) => SchoolModel.fromJson(s as Map<String, dynamic>))
            .toList();
        final activeSchool = data['activeSchool'] != null
            ? SchoolModel.fromJson(data['activeSchool'])
            : (schools.isNotEmpty ? schools.first : null);

        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: user,
          schools: schools,
          activeSchool: activeSchool,
        );
      } else {
        await _storage.clearAll();
        state = AuthState();
      }
    } catch (_) {
      await _storage.clearAll();
      state = AuthState();
    }
  }

  Future<bool> requestOtp({required String identifier, required String type}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _client.dio.post(
        AppConstants.endpointOtpRequest,
        data: {'identifier': identifier, 'type': type},
      );
      state = state.copyWith(isLoading: false);
      return res.statusCode == 200 && res.data['success'] == true;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Failed to request OTP. Please try again.');
      return false;
    }
  }

  Future<bool> verifyOtp({required String identifier, required String otp}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _client.dio.post(
        AppConstants.endpointOtpVerify,
        data: {'identifier': identifier, 'otp': otp},
      );

      final data = res.data;
      if (res.statusCode == 200 && data['mfaRequired'] == true) {
        // MFA is ON for this parent
        state = state.copyWith(
          isLoading: false,
          mfaRequired: true,
          mfaChallengeToken: data['challengeToken'] as String?,
        );
        return true;
      }

      if (res.statusCode == 200 && data['success'] == true) {
        // MFA OFF: fully authenticated
        final token = data['token'] as String?;
        if (token != null) {
          await _storage.saveAuthToken(token);
        }

        final schools = (data['schools'] as List<dynamic>? ?? [])
            .map((s) => SchoolModel.fromJson(s as Map<String, dynamic>))
            .toList();
        final user = data['user'] != null ? UserModel.fromJson(data['user']) : null;
        final activeSchool = data['activeSchool'] != null
            ? SchoolModel.fromJson(data['activeSchool'])
            : (schools.isNotEmpty ? schools.first : null);

        if (activeSchool != null) {
          await _storage.saveSelectedSchool(activeSchool.id);
        }

        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          mfaRequired: false,
          mfaChallengeToken: null,
          user: user,
          schools: schools,
          activeSchool: activeSchool,
        );
        return true;
      }

      state = state.copyWith(
        isLoading: false,
        errorMessage: data['error'] ?? 'Invalid or expired OTP',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Invalid verification code or server error.',
      );
      return false;
    }
  }

  Future<bool> verifyMfa(String code) async {
    final challenge = state.mfaChallengeToken;
    if (challenge == null) return false;

    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _client.dio.post(
        AppConstants.endpointMfaVerify,
        data: {'challengeToken': challenge, 'code': code},
      );

      if (res.statusCode == 200 && res.data['success'] == true) {
        final token = res.data['token'] as String?;
        if (token != null) {
          await _storage.saveAuthToken(token);
        }
        await checkInitialSession();
        return true;
      }

      state = state.copyWith(
        isLoading: false,
        errorMessage: res.data['error'] ?? 'Invalid MFA authenticator code',
      );
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'MFA verification failed');
      return false;
    }
  }

  Future<void> selectSchool(String schoolId) async {
    try {
      final res = await _client.dio.post(
        AppConstants.endpointSelectSchool,
        data: {'schoolId': schoolId},
      );
      if (res.statusCode == 200 && res.data['success'] == true) {
        await _storage.saveSelectedSchool(schoolId);
        final selected = state.schools.firstWhere((s) => s.id == schoolId);
        state = state.copyWith(activeSchool: selected);
      }
    } catch (_) {}
  }

  Future<void> logout() async {
    try {
      await _client.dio.post(AppConstants.endpointLogout);
    } catch (_) {}
    await _storage.clearAll();
    state = AuthState();
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(client, storage);
});
