class NoticeModel {
  final String id;
  final String title;
  final String content;
  final String? priority;
  final DateTime publishedAt;
  final bool isRead;

  NoticeModel({
    required this.id,
    required this.title,
    required this.content,
    this.priority,
    required this.publishedAt,
    this.isRead = false,
  });

  factory NoticeModel.fromJson(Map<String, dynamic> json) {
    return NoticeModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Notice',
      content: json['content'] as String? ?? '',
      priority: json['priority'] as String?,
      publishedAt: json['publishedAt'] != null
          ? DateTime.parse(json['publishedAt'] as String)
          : DateTime.now(),
      isRead: json['isRead'] as bool? ?? false,
    );
  }
}

class AppNotificationModel {
  final String id;
  final String title;
  final String body;
  final String? type;
  final String? link;
  final bool isRead;
  final DateTime createdAt;

  AppNotificationModel({
    required this.id,
    required this.title,
    required this.body,
    this.type,
    this.link,
    this.isRead = false,
    required this.createdAt,
  });

  factory AppNotificationModel.fromJson(Map<String, dynamic> json) {
    return AppNotificationModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Notification',
      body: json['body'] as String? ?? '',
      type: json['type'] as String?,
      link: json['link'] as String?,
      isRead: json['isRead'] as bool? ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}

class ResultModel {
  final String id;
  final String examTitle;
  final String academicYear;
  final double percentage;
  final String? overallGrade;
  final String status;
  final List<SubjectMarkModel> subjectMarks;

  ResultModel({
    required this.id,
    required this.examTitle,
    required this.academicYear,
    required this.percentage,
    this.overallGrade,
    required this.status,
    required this.subjectMarks,
  });

  factory ResultModel.fromJson(Map<String, dynamic> json) {
    final marksJson = json['subjectMarks'] as List<dynamic>? ?? [];
    return ResultModel(
      id: json['id'] as String,
      examTitle: json['examTitle'] as String? ?? 'Exam',
      academicYear: json['academicYear'] as String? ?? '',
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      overallGrade: json['overallGrade'] as String?,
      status: json['status'] as String? ?? 'PUBLISHED',
      subjectMarks: marksJson
          .map((m) => SubjectMarkModel.fromJson(m as Map<String, dynamic>))
          .toList(),
    );
  }
}

class SubjectMarkModel {
  final String subjectName;
  final double score;
  final double maxScore;
  final String? grade;

  SubjectMarkModel({
    required this.subjectName,
    required this.score,
    required this.maxScore,
    this.grade,
  });

  factory SubjectMarkModel.fromJson(Map<String, dynamic> json) {
    return SubjectMarkModel(
      subjectName: json['subjectName'] as String? ?? '',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 100.0,
      grade: json['grade'] as String?,
    );
  }
}
