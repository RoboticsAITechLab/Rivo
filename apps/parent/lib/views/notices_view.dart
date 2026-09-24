import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/parent_provider.dart';

class NoticesView extends ConsumerWidget {
  const NoticesView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final noticesAsync = ref.watch(noticesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text('Notices & Circulars', style: TextStyle(color: Colors.white, fontSize: 18)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.go('/'),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(noticesProvider),
        child: noticesAsync.when(
          data: (notices) {
            if (notices.isEmpty) {
              return const Center(
                child: Text('No new notices.', style: TextStyle(color: Color(0xFF64748B), fontSize: 15)),
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: notices.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final notice = notices[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              notice.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          if (notice.priority == 'HIGH')
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0x33EF4444),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Text(
                                'URGENT',
                                style: TextStyle(color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        notice.content,
                        style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14, height: 1.4),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Published: ${notice.publishedAt.toLocal().toString().split(' ')[0]}',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => const Center(
            child: Text('Failed to load notices.', style: TextStyle(color: Color(0xFFEF4444))),
          ),
        ),
      ),
    );
  }
}
