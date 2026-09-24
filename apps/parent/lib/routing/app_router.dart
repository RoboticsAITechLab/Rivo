import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../views/home_view.dart';
import '../views/login_view.dart';
import '../views/mfa_view.dart';
import '../views/notices_view.dart';
import '../views/notifications_view.dart';
import '../views/profile_view.dart';
import '../views/results_view.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (BuildContext context, GoRouterState state) {
      final isLoggingIn = state.matchedLocation == '/login';
      final isVerifyingMfa = state.matchedLocation == '/mfa';

      if (!authState.isAuthenticated) {
        if (authState.mfaRequired) {
          return '/mfa';
        }
        return isLoggingIn ? null : '/login';
      }

      if (isLoggingIn || isVerifyingMfa) {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginView(),
      ),
      GoRoute(
        path: '/mfa',
        builder: (context, state) => const MfaView(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeView(),
      ),
      GoRoute(
        path: '/notices',
        builder: (context, state) => const NoticesView(),
      ),
      GoRoute(
        path: '/results',
        builder: (context, state) => const ResultsView(),
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsView(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileView(),
      ),
    ],
  );
});
