import 'package:dio/dio.dart';
import 'constants.dart';
import 'storage.dart';

class ApiClient {
  late final Dio dio;
  final SecureStorageService storage;

  ApiClient({required this.storage, String? baseUrl}) {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? AppConstants.defaultBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await storage.getAuthToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          final schoolId = await storage.getSelectedSchool();
          if (schoolId != null && schoolId.isNotEmpty) {
            options.headers['X-School-Id'] = schoolId;
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // If 401 Unauthorized, token may be expired
          if (e.response?.statusCode == 401) {
            storage.clearAll();
          }
          return handler.next(e);
        },
      ),
    );
  }
}
