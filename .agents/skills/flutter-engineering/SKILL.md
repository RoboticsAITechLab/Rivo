---
name: flutter-engineering
description: Production Flutter client architecture, Riverpod state management, secure token storage, Dio network resilience, and offline-first mobile caching
version: 1.0.0
technologies:
  - Flutter 3.x / Dart 3.x
  - flutter_riverpod 2.5+
  - dio 5.x
  - flutter_secure_storage
sources:
  - https://docs.flutter.dev
  - https://riverpod.dev
  - https://pub.dev/packages/dio
verification_date: 2026-11-11
---

# Flutter Mobile Client Engineering Skill

## 1. Purpose & Scope
Standards for Flutter mobile client development (`apps/parent`), Riverpod state management, bi-directional API synchronization, secure credential handling, and offline reliability.

## 2. Core Engineering Principles
1. **Secure Credential Storage**: Never store authentication tokens, session secrets, or sensitive parent phone numbers in plain `SharedPreferences`. Always use `flutter_secure_storage` which utilizes Keychain on iOS and EncryptedSharedPreferences (Keystore) on Android.
2. **Unified Dio Interceptor Stack**:
   - **Auth Interceptor**: Automatically inject `Authorization: Bearer <token>` or session cookies on outbound requests.
   - **Retry Interceptor**: Implement exponential backoff for network drops on idempotent `GET` requests.
   - **Error Handling Interceptor**: Intercept HTTP 401 Unauthorized responses and redirect user to OTP login screen while flushing cached tokens.
3. **Riverpod State Isolation**: Separate UI presentation widgets from domain state. Use `StateNotifierProvider` or `AsyncNotifierProvider` to represent async states cleanly (`AsyncValue.loading()`, `AsyncValue.data()`, `AsyncValue.error()`).
4. **Scoped MVP Strategy**: Parent mobile application scope is strictly maintained for Admin MVP compatibility (OTP login, student attendance viewing, fee receipt download, school announcements). Do not expand unsolicited features until School Admin portal is production-stabilized.

## 3. Production Readiness Checklist
- [ ] Session tokens stored exclusively in `flutter_secure_storage`.
- [ ] Network requests wrapped with error handling and retry logic in Dio.
- [ ] Navigation handled via declarative `go_router`.
- [ ] Clean empty states and pull-to-refresh implemented on lists.

