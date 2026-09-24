import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/api_client.dart';
import '../core/constants.dart';
import '../core/storage.dart';
import '../models/content.dart';
import '../models/user.dart';
import 'auth_provider.dart';

final selectedChildIdProvider = StateProvider<String?>((ref) => null);

final childrenProvider = FutureProvider<List<ChildModel>>((ref) async {
  final client = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);

  try {
    final res = await client.dio.get(AppConstants.endpointChildren);
    if (res.statusCode == 200 && res.data['success'] == true) {
      final list = (res.data['data'] as List<dynamic>)
          .map((c) => ChildModel.fromJson(c as Map<String, dynamic>))
          .toList();

      final currentSelected = ref.read(selectedChildIdProvider);
      if (currentSelected == null && list.isNotEmpty) {
        ref.read(selectedChildIdProvider.notifier).state = list.first.id;
        await storage.saveSelectedChild(list.first.id);
      }
      return list;
    }
  } catch (_) {}
  return [];
});

final noticesProvider = FutureProvider<List<NoticeModel>>((ref) async {
  final client = ref.watch(apiClientProvider);
  final selectedChildId = ref.watch(selectedChildIdProvider);

  try {
    final res = await client.dio.get(
      AppConstants.endpointNotices,
      queryParameters: selectedChildId != null ? {'childId': selectedChildId} : null,
    );
    if (res.statusCode == 200 && res.data['success'] == true) {
      return (res.data['data'] as List<dynamic>)
          .map((n) => NoticeModel.fromJson(n as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

final notificationsProvider = FutureProvider<List<AppNotificationModel>>((ref) async {
  final client = ref.watch(apiClientProvider);

  try {
    final res = await client.dio.get(AppConstants.endpointNotifications);
    if (res.statusCode == 200 && res.data['success'] == true) {
      return (res.data['data'] as List<dynamic>)
          .map((n) => AppNotificationModel.fromJson(n as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

final resultsProvider = FutureProvider<List<ResultModel>>((ref) async {
  final client = ref.watch(apiClientProvider);
  final selectedChildId = ref.watch(selectedChildIdProvider);
  if (selectedChildId == null) return [];

  try {
    final res = await client.dio.get(
      AppConstants.endpointResults,
      queryParameters: {'studentId': selectedChildId},
    );
    if (res.statusCode == 200 && res.data['success'] == true) {
      return (res.data['data'] as List<dynamic>)
          .map((r) => ResultModel.fromJson(r as Map<String, dynamic>))
          .toList();
    }
  } catch (_) {}
  return [];
});

class DeviceTokenService {
  final ApiClient _client;
  DeviceTokenService(this._client);

  Future<void> registerDeviceToken({
    required String token,
    required String platform,
  }) async {
    try {
      await _client.dio.post(
        AppConstants.endpointDeviceToken,
        data: {
          'token': token,
          'platform': platform,
        },
      );
    } catch (_) {}
  }
}

final deviceTokenServiceProvider = Provider<DeviceTokenService>((ref) {
  final client = ref.watch(apiClientProvider);
  return DeviceTokenService(client);
});
