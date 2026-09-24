class UserModel {
  final String id;
  final String? email;
  final String? phone;
  final String? firstName;
  final String? lastName;
  final bool mfaEnabled;

  UserModel({
    required this.id,
    this.email,
    this.phone,
    this.firstName,
    this.lastName,
    this.mfaEnabled = false,
  });

  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim().isNotEmpty
      ? '${firstName ?? ''} ${lastName ?? ''}'.trim()
      : (phone ?? email ?? 'Parent');

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      mfaEnabled: json['mfaEnabled'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'phone': phone,
        'firstName': firstName,
        'lastName': lastName,
        'mfaEnabled': mfaEnabled,
      };
}

class SchoolModel {
  final String id;
  final String name;
  final String? code;
  final String? logoUrl;
  final String role;

  SchoolModel({
    required this.id,
    required this.name,
    this.code,
    this.logoUrl,
    required this.role,
  });

  factory SchoolModel.fromJson(Map<String, dynamic> json) {
    return SchoolModel(
      id: json['id'] as String,
      name: json['name'] as String,
      code: json['code'] as String?,
      logoUrl: json['logoUrl'] as String?,
      role: json['role'] as String? ?? 'PARENT',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'code': code,
        'logoUrl': logoUrl,
        'role': role,
      };
}

class ChildModel {
  final String id;
  final String firstName;
  final String lastName;
  final String admissionNumber;
  final String? rollNumber;
  final String schoolId;
  final String schoolName;
  final String className;
  final String sectionName;
  final String relationship;

  ChildModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.admissionNumber,
    this.rollNumber,
    required this.schoolId,
    required this.schoolName,
    required this.className,
    required this.sectionName,
    required this.relationship,
  });

  String get fullName => '$firstName $lastName'.trim();
  String get classSection => '$className-$sectionName';

  factory ChildModel.fromJson(Map<String, dynamic> json) {
    return ChildModel(
      id: json['id'] as String,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      admissionNumber: json['admissionNumber'] as String? ?? '',
      rollNumber: json['rollNumber'] as String?,
      schoolId: json['schoolId'] as String? ?? '',
      schoolName: json['schoolName'] as String? ?? '',
      className: json['className'] as String? ?? '',
      sectionName: json['sectionName'] as String? ?? '',
      relationship: json['relationship'] as String? ?? 'GUARDIAN',
    );
  }
}
