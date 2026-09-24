class AppConstants {
  static const String appName = 'Rivo Parent';
  static const String defaultBaseUrl = 'https://app.rivo.school';
  
  // Storage Keys
  static const String keyAuthToken = 'rivo_auth_token';
  static const String keyUser = 'rivo_user_cache';
  static const String keySelectedSchoolId = 'rivo_selected_school_id';
  static const String keySelectedChildId = 'rivo_selected_child_id';
  
  // API Endpoints
  static const String endpointOtpRequest = '/api/auth/parent/otp/request';
  static const String endpointOtpVerify = '/api/auth/parent/otp/verify';
  static const String endpointMfaVerify = '/api/auth/mfa/verify';
  static const String endpointSelectSchool = '/api/auth/parent/select-school';
  static const String endpointParentMe = '/api/auth/parent/me';
  static const String endpointLogout = '/api/auth/logout';
  static const String endpointChildren = '/api/parent/children';
  static const String endpointNotices = '/api/notices';
  static const String endpointResults = '/api/results';
  static const String endpointNotifications = '/api/notifications';
  static const String endpointDeviceToken = '/api/parent/device-token';
}
