export type CustomFieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'decimal'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'yesno'
  | 'phone'
  | 'email'
  | 'url';

export type CustomFieldGroup =
  | 'PERSONAL'
  | 'ADMISSION'
  | 'FAMILY'
  | 'TRANSPORT'
  | 'SCHOOL_SPECIFIC';

export interface CustomFieldDefinition {
  id: string;
  name: string;
  key: string;
  group: CustomFieldGroup;
  type: CustomFieldType;
  description?: string;
  options?: string[];
  defaultValue?: string | number | boolean;
  required: boolean;
  active: boolean;
  showInAdmission: boolean;
  showInProfile: boolean;
  visibleToTeachers: boolean;
  visibleToParents: boolean;
}

export interface AdmissionFormSectionConfig {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  required: boolean;
  isSystemRequired: boolean;
}

export interface DocumentRequirementPolicy {
  birthCertificate: 'OPTIONAL' | 'REQUIRED' | 'DISABLED';
  previousMarksheetForTransfer: 'REQUIRED' | 'OPTIONAL';
  transferCertificateForTransfer: 'REQUIRED' | 'OPTIONAL';
}
