export interface SuggestedFeeHead {
  code: string;
  name: string;
  category: 'TUITION' | 'FACILITY' | 'EXAMINATION' | 'TRANSPORT' | 'HOSTEL' | 'OTHER';
  description: string;
}

export const SUGGESTED_FEE_HEADS: SuggestedFeeHead[] = [
  { code: 'TUIT', name: 'Tuition Fee', category: 'TUITION', description: 'Core curriculum delivery and instructional fees' },
  { code: 'LAB',  name: 'Laboratory Fee', category: 'FACILITY', description: 'Science, computer, and STEM lab maintenance & consumable fee' },
  { code: 'EXAM', name: 'Examination & Assessment Fee', category: 'EXAMINATION', description: 'Periodic evaluation, examination administration, and report card generation' },
  { code: 'LIB',  name: 'Library & Digital Resources', category: 'FACILITY', description: 'Physical library catalogue access and online digital subscriptions' },
  { code: 'SPRT', name: 'Sports & Athletic Development', category: 'FACILITY', description: 'Sports facilities, athletic equipment, and tournament participation' },
  { code: 'DEV',  name: 'School Infrastructure & Development', category: 'OTHER', description: 'Campus development, safety infrastructure, and amenities upkeep' },
];

export const STREAM_OPTIONS = [
  { value: '', label: 'All Streams (General / Uniform)' },
  { value: 'Science', label: 'Science (PCM / PCB)' },
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Arts/Humanities', label: 'Arts & Humanities' },
  { value: 'Vocational', label: 'Vocational & Applied Sciences' },
];

export type ConcessionType = 'FIXED_AMOUNT' | 'PERCENTAGE';

export type ConcessionCategory =
  | 'MERIT'
  | 'SIBLING'
  | 'STAFF'
  | 'SCHOLARSHIP'
  | 'FINANCIAL_HARDSHIP'
  | 'SPECIAL_CASE'
  | 'OTHER';

export const CONCESSION_CATEGORIES: { value: ConcessionCategory; label: string; description: string }[] = [
  { value: 'MERIT', label: 'Academic Merit / Honors', description: 'Academic excellence and top-tier examination rank awards' },
  { value: 'SIBLING', label: 'Sibling Discount', description: 'Institutional concession for multi-child family enrollments' },
  { value: 'STAFF', label: 'Faculty & Staff Child Concession', description: 'Institutional benefit for employed teachers and staff' },
  { value: 'SCHOLARSHIP', label: 'Institutional / Foundation Scholarship', description: 'Endowed scholarships or philanthropic trust grants' },
  { value: 'FINANCIAL_HARDSHIP', label: 'Economic Hardship Relief', description: 'Discretionary fee reduction for demonstrated financial distress' },
  { value: 'SPECIAL_CASE', label: 'Special Discretionary Case', description: 'Principal / Management approved special concession' },
  { value: 'OTHER', label: 'Other Justified Waiver', description: 'Custom institutional waiver with documented justification' },
];
