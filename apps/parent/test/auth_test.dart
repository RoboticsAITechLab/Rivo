import 'package:flutter_test/flutter_test.dart';
import 'package:rivo_parent/models/user.dart';
import 'package:rivo_parent/models/content.dart';

void main() {
  group('Rivo Parent Models & Serialization Test', () {
    test('UserModel parse and serialization', () {
      final json = {
        'id': 'user_123',
        'email': 'parent@example.com',
        'phone': '+919876543210',
        'firstName': 'Anita',
        'lastName': 'Sharma',
        'mfaEnabled': true,
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 'user_123');
      expect(user.fullName, 'Anita Sharma');
      expect(user.mfaEnabled, true);
      expect(user.phone, '+919876543210');
    });

    test('SchoolModel parsing', () {
      final json = {
        'id': 'school_456',
        'name': 'Delhi Public School',
        'code': 'DPS01',
        'role': 'PARENT',
      };

      final school = SchoolModel.fromJson(json);
      expect(school.id, 'school_456');
      expect(school.name, 'Delhi Public School');
      expect(school.role, 'PARENT');
    });

    test('ChildModel parsing and accessors', () {
      final json = {
        'id': 'student_789',
        'firstName': 'Aarav',
        'lastName': 'Sharma',
        'admissionNumber': 'ADM-2026-001',
        'schoolId': 'school_456',
        'schoolName': 'Delhi Public School',
        'className': '10',
        'sectionName': 'A',
        'relationship': 'MOTHER',
      };

      final child = ChildModel.fromJson(json);
      expect(child.fullName, 'Aarav Sharma');
      expect(child.classSection, '10-A');
      expect(child.admissionNumber, 'ADM-2026-001');
    });

    test('ResultModel calculates percentage and subject details', () {
      final json = {
        'id': 'res_1',
        'examTitle': 'Final Term 2026',
        'academicYear': '2025-2026',
        'percentage': 92.5,
        'overallGrade': 'A1',
        'status': 'PUBLISHED',
        'subjectMarks': [
          {'subjectName': 'Mathematics', 'score': 95.0, 'maxScore': 100.0, 'grade': 'A1'},
          {'subjectName': 'Physics', 'score': 90.0, 'maxScore': 100.0, 'grade': 'A1'},
        ],
      };

      final result = ResultModel.fromJson(json);
      expect(result.examTitle, 'Final Term 2026');
      expect(result.percentage, 92.5);
      expect(result.overallGrade, 'A1');
      expect(result.subjectMarks.length, 2);
    });
  });
}
