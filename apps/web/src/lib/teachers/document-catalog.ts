export interface DocumentDefinition {
  code: string;
  name: string;
  category: 'KYC' | 'EDUCATIONAL' | 'EMPLOYMENT' | 'CUSTOM';
  description: string;
  defaultRequired: boolean;
  hasNumber: boolean;
  hasExpiry: boolean;
  allowedExtensions: string[];
  maxSizeMb: number;
}

export const STANDARD_TEACHER_DOCUMENTS: DocumentDefinition[] = [
  // 1. Identity / KYC
  {
    code: 'AADHAAR_CARD',
    name: 'Aadhaar Card',
    category: 'KYC',
    description: 'Government of India Unique Identification Card (Front & Back or Combined PDF)',
    defaultRequired: true,
    hasNumber: true,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 5,
  },
  {
    code: 'PAN_CARD',
    name: 'PAN Card',
    category: 'KYC',
    description: 'Income Tax Department Permanent Account Number card',
    defaultRequired: true,
    hasNumber: true,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 5,
  },
  {
    code: 'PASSPORT',
    name: 'Passport',
    category: 'KYC',
    description: 'Official Republic of India or Foreign Passport identification pages',
    defaultRequired: false,
    hasNumber: true,
    hasExpiry: true,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 5,
  },
  {
    code: 'VOTER_ID',
    name: 'Voter ID Card',
    category: 'KYC',
    description: 'Election Commission of India Electoral Photo ID Card (EPIC)',
    defaultRequired: false,
    hasNumber: true,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 5,
  },
  {
    code: 'DRIVING_LICENCE',
    name: 'Driving Licence',
    category: 'KYC',
    description: 'State Transport Authority Motor Vehicle Driving Licence',
    defaultRequired: false,
    hasNumber: true,
    hasExpiry: true,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 5,
  },

  // 2. Educational
  {
    code: 'CLASS_10_MARKSHEET',
    name: 'Class 10 (Secondary) Marksheet / Certificate',
    category: 'EDUCATIONAL',
    description: 'Secondary School Examination passing marksheet / certificate for age & subject proof',
    defaultRequired: true,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'CLASS_12_MARKSHEET',
    name: 'Class 12 (Higher Secondary) Marksheet',
    category: 'EDUCATIONAL',
    description: 'Senior School Certificate Examination (10+2) marksheet',
    defaultRequired: true,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'GRADUATION_DEGREE',
    name: 'Graduation Degree Certificate',
    category: 'EDUCATIONAL',
    description: "Bachelor's Degree (B.A, B.Sc, B.Com, B.Tech, B.C.A or equivalent) convocation certificate",
    defaultRequired: true,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'GRADUATION_MARKSHEET',
    name: 'Graduation Consolidated Marksheet',
    category: 'EDUCATIONAL',
    description: 'Consolidated marks transcript of undergraduate degree',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'POST_GRADUATION_DEGREE',
    name: 'Post-Graduation Degree Certificate',
    category: 'EDUCATIONAL',
    description: "Master's Degree (M.A, M.Sc, M.Com, M.Tech, M.C.A or equivalent) degree certificate",
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'BED_DEGREE',
    name: 'B.Ed Degree / Certificate',
    category: 'EDUCATIONAL',
    description: 'Bachelor of Education professional teacher training degree certificate',
    defaultRequired: true,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'MED_DEGREE',
    name: 'M.Ed Degree Certificate',
    category: 'EDUCATIONAL',
    description: 'Master of Education postgraduate degree certificate',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'DELED_DIPLOMA',
    name: 'D.El.Ed / D.Ed Diploma',
    category: 'EDUCATIONAL',
    description: 'Diploma in Elementary Education certificate',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'CTET_CERTIFICATE',
    name: 'CTET Eligibility Certificate',
    category: 'EDUCATIONAL',
    description: 'Central Teacher Eligibility Test (CBSE) DigiLocker verified eligibility certificate',
    defaultRequired: false,
    hasNumber: true,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'STATE_TET_CERTIFICATE',
    name: 'State TET / REET / SET Certificate',
    category: 'EDUCATIONAL',
    description: 'State Teacher Eligibility Test or State Eligibility Test certification',
    defaultRequired: false,
    hasNumber: true,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'OTHER_QUALIFICATION',
    name: 'Other Academic / Professional Qualification',
    category: 'EDUCATIONAL',
    description: 'Additional diploma, specialization or vocational certification',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },

  // 3. Employment & Verification
  {
    code: 'APPOINTMENT_LETTER',
    name: 'Official Appointment Letter',
    category: 'EMPLOYMENT',
    description: 'Current institution appointment and designation letter with terms of service',
    defaultRequired: true,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'JOINING_LETTER',
    name: 'Joining Report / Acceptance Letter',
    category: 'EMPLOYMENT',
    description: 'Formal duty joining report signed by the faculty member and Head of School',
    defaultRequired: true,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'EXPERIENCE_CERTIFICATE',
    name: 'Previous Experience Certificate',
    category: 'EMPLOYMENT',
    description: 'Experience letter from previous academic institutions or employers',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'RELIEVING_LETTER',
    name: 'Previous Relieving Letter / NOC',
    category: 'EMPLOYMENT',
    description: 'Formal relieving certificate from the immediate prior employer',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'POLICE_VERIFICATION',
    name: 'Police Verification Certificate',
    category: 'EMPLOYMENT',
    description: 'Official background and character clearance certificate from law enforcement',
    defaultRequired: false,
    hasNumber: true,
    hasExpiry: true,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'BACKGROUND_VERIFICATION',
    name: 'Background Verification Report',
    category: 'EMPLOYMENT',
    description: 'Third-party or institutional employee background verification dossier',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
  {
    code: 'OTHER_EMPLOYMENT_DOC',
    name: 'Other Employment / HR Document',
    category: 'EMPLOYMENT',
    description: 'Miscellaneous HR, medical fitness, or service contract document',
    defaultRequired: false,
    hasNumber: false,
    hasExpiry: false,
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    maxSizeMb: 10,
  },
];

/**
 * Mask sensitive identity numbers for display (e.g. Aadhaar: XXXX XXXX 1234, PAN: XXXXX1234X)
 */
export function maskDocumentNumber(docType: string, number?: string | null): string | null {
  if (!number) return null;
  const clean = number.replace(/[\s-]/g, '').toUpperCase();
  if (docType === 'AADHAAR_CARD' || docType.includes('AADHAAR')) {
    if (clean.length >= 4) {
      const last4 = clean.slice(-4);
      return `XXXX XXXX ${last4}`;
    }
    return 'XXXX XXXX XXXX';
  }
  if (docType === 'PAN_CARD' || docType.includes('PAN')) {
    if (clean.length === 10) {
      return `XXXXX${clean.slice(5, 9)}${clean.slice(9)}`;
    }
    return 'XXXXX1234X';
  }
  if (docType === 'PASSPORT') {
    if (clean.length >= 3) {
      return `${clean[0]}XXXX${clean.slice(-3)}`;
    }
    return 'PXXXXXXX';
  }
  if (docType === 'DRIVING_LICENCE') {
    if (clean.length >= 4) {
      return `DL-XXXX...${clean.slice(-4)}`;
    }
    return 'DL-XXXXXXXX';
  }
  if (clean.length > 4) {
    return `***${clean.slice(-4)}`;
  }
  return '******';
}

/**
 * Calculate document expiration status: VALID, EXPIRING_SOON, EXPIRED, or NO_EXPIRY
 */
export function calculateExpiryStatus(expiryDate?: Date | string | null, warningDays = 30): {
  status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
  daysRemaining: number | null;
} {
  if (!expiryDate) {
    return { status: 'NO_EXPIRY', daysRemaining: null };
  }
  const exp = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  if (isNaN(exp.getTime())) {
    return { status: 'NO_EXPIRY', daysRemaining: null };
  }
  const now = new Date();
  const diffMs = exp.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'EXPIRED', daysRemaining };
  }
  if (daysRemaining <= warningDays) {
    return { status: 'EXPIRING_SOON', daysRemaining };
  }
  return { status: 'VALID', daysRemaining };
}

/**
 * Calculate required document checklist completion
 */
export function calculateDocumentChecklist(
  uploadedDocuments: Array<{ documentType: string; status: string }>,
  requiredDocumentTypes: string[] = ['AADHAAR_CARD', 'PAN_CARD', 'CLASS_10_MARKSHEET', 'GRADUATION_DEGREE', 'BED_DEGREE', 'APPOINTMENT_LETTER', 'JOINING_LETTER']
): {
  totalRequired: number;
  submittedRequired: number;
  verifiedRequired: number;
  completionPercentage: number;
  missingRequiredTypes: string[];
} {
  const uploadedTypeSet = new Set(uploadedDocuments.map((d) => d.documentType));
  const verifiedTypeSet = new Set(
    uploadedDocuments.filter((d) => d.status === 'VERIFIED').map((d) => d.documentType)
  );

  let submittedRequired = 0;
  let verifiedRequired = 0;
  const missingRequiredTypes: string[] = [];

  for (const reqType of requiredDocumentTypes) {
    if (uploadedTypeSet.has(reqType)) {
      submittedRequired++;
    } else {
      missingRequiredTypes.push(reqType);
    }
    if (verifiedTypeSet.has(reqType)) {
      verifiedRequired++;
    }
  }

  const totalRequired = requiredDocumentTypes.length;
  const completionPercentage =
    totalRequired > 0 ? Math.round((submittedRequired / totalRequired) * 100) : 100;

  return {
    totalRequired,
    submittedRequired,
    verifiedRequired,
    completionPercentage,
    missingRequiredTypes,
  };
}
