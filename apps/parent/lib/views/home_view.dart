import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/parent_provider.dart';

class HomeView extends ConsumerWidget {
  const HomeView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final childrenAsync = ref.watch(childrenProvider);
    final selectedChildId = ref.watch(selectedChildIdProvider);
    final noticesAsync = ref.watch(noticesProvider);
    final resultsAsync = ref.watch(resultsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Rivo Parent',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            if (authState.activeSchool != null)
              Text(
                authState.activeSchool!.name,
                style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
              ),
          ],
        ),
        actions: [
          // Multi-school switcher if parent belongs to >1 school
          if (authState.schools.length > 1)
            PopupMenuButton<String>(
              icon: const Icon(Icons.domain, color: Colors.white),
              tooltip: 'Switch School',
              onSelected: (schoolId) {
                ref.read(authProvider.notifier).selectSchool(schoolId);
                ref.refresh(childrenProvider);
              },
              itemBuilder: (context) {
                return authState.schools.map((s) {
                  return PopupMenuItem(
                    value: s.id,
                    child: Text(
                      s.name,
                      style: TextStyle(
                        fontWeight: s.id == authState.activeSchool?.id
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                    ),
                  );
                }).toList();
              },
            ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined, color: Colors.white),
            onPressed: () => context.go('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline, color: Colors.white),
            onPressed: () => context.go('/profile'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.refresh(childrenProvider);
          ref.refresh(noticesProvider);
          ref.refresh(resultsProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Child Selector
              childrenAsync.when(
                data: (children) {
                  if (children.isEmpty) {
                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Color(0xFF64748B)),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'No linked students found for this school context.',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  final selectedChild = children.firstWhere(
                    (c) => c.id == selectedChildId,
                    orElse: () => children.first,
                  );

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF312E81), Color(0xFF1E1B4B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF4338CA)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'SELECTED STUDENT',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFA5B4FC),
                                letterSpacing: 1.2,
                              ),
                            ),
                            if (children.length > 1)
                              DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  dropdownColor: const Color(0xFF1E293B),
                                  value: selectedChild.id,
                                  icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                                  onChanged: (id) {
                                    if (id != null) {
                                      ref.read(selectedChildIdProvider.notifier).state = id;
                                      ref.read(secureStorageProvider).saveSelectedChild(id);
                                    }
                                  },
                                  items: children.map((c) {
                                    return DropdownMenuItem(
                                      value: c.id,
                                      child: Text(
                                        c.fullName,
                                        style: const TextStyle(color: Colors.white, fontSize: 14),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          selectedChild.fullName,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Class: ${selectedChild.classSection}  •  Adm: ${selectedChild.admissionNumber}',
                          style: const TextStyle(color: Color(0xFFC7D2FE), fontSize: 13),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => const SizedBox.shrink(),
              ),

              const SizedBox(height: 24),

              // Quick Action Tiles
              Row(
                children: [
                  Expanded(
                    child: _buildActionTile(
                      context,
                      title: 'Notices',
                      icon: Icons.campaign_outlined,
                      color: const Color(0xFF3B82F6),
                      onTap: () => context.go('/notices'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildActionTile(
                      context,
                      title: 'Results',
                      icon: Icons.assignment_turned_in_outlined,
                      color: const Color(0xFF10B981),
                      onTap: () => context.go('/results'),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Latest Notice Section
              const Text(
                'Latest Announcements',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              noticesAsync.when(
                data: (notices) {
                  if (notices.isEmpty) {
                    return _buildEmptyState(icon: Icons.campaign_outlined, message: 'No new notices.');
                  }
                  final latest = notices.first;
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
                                latest.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            if (latest.priority == 'HIGH')
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
                        const SizedBox(height: 6),
                        Text(
                          latest.content,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _buildEmptyState(icon: Icons.campaign_outlined, message: 'No new notices.'),
              ),

              const SizedBox(height: 24),

              // Latest Result Section
              const Text(
                'Published Results',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 12),
              resultsAsync.when(
                data: (results) {
                  if (results.isEmpty) {
                    return _buildEmptyState(
                      icon: Icons.assignment_turned_in_outlined,
                      message: 'No published results yet.',
                    );
                  }
                  final latest = results.first;
                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              latest.examTitle,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontSize: 15,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Academic Year: ${latest.academicYear}',
                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0x3310B981),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${latest.percentage.toStringAsFixed(1)}%',
                            style: const TextStyle(
                              color: Color(0xFF34D399),
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _buildEmptyState(
                  icon: Icons.assignment_turned_in_outlined,
                  message: 'No published results yet.',
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        backgroundColor: const Color(0xFF1E293B),
        selectedItemColor: const Color(0xFF6366F1),
        unselectedItemColor: const Color(0xFF64748B),
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          switch (index) {
            case 0:
              break;
            case 1:
              context.go('/notices');
              break;
            case 2:
              context.go('/results');
              break;
            case 3:
              context.go('/notifications');
              break;
            case 4:
              context.go('/profile');
              break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.campaign_outlined), label: 'Notices'),
          BottomNavigationBarItem(icon: Icon(Icons.assignment_turned_in_outlined), label: 'Results'),
          BottomNavigationBarItem(icon: Icon(Icons.notifications_outlined), label: 'Alerts'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildActionTile(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF334155)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState({required IconData icon, required String message}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF334155)),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF475569), size: 36),
          const SizedBox(height: 8),
          Text(message, style: const TextStyle(color: Color(0xFF64748B), fontSize: 13)),
        ],
      ),
    );
  }
}
