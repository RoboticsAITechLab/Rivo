import { SchoolStoreState } from '../mock-store/school-store';
import { StudentId } from '../types';

export interface ProposedRollAllocation {
  studentId: StudentId;
  studentName: string;
  admissionNumber: string;
  campusId: string;
  campusName: string;
  classId: string;
  className: string;
  sectionName: string;
  streamId?: string | null;
  streamName?: string;
  existingRollNumber?: string | null;
  proposedRollNumber: string;
  isNewAllocation: boolean;
  status: 'READY' | 'CONFLICT' | 'UNCHANGED';
  conflictMessage?: string;
}

export interface BulkAllocationPreviewResult {
  allocations: ProposedRollAllocation[];
  totalEligible: number;
  newAllocationsCount: number;
  unchangedCount: number;
  conflictsCount: number;
}

export function findNextAvailableExamRollNumber(
  store: SchoolStoreState,
  options: {
    classId: string;
    streamId?: string | null;
    campusId?: string;
  }
): string {
  const { classId, streamId } = options;
  const isSenior = classId === 'cls-11' || classId === 'cls-12';
  const config = store.rollAllocationConfig;

  // Stream-aware numbering for senior secondary (Classes 11 & 12)
  if (isSenior && streamId && config.class11_12Rule.streamAware) {
    const streamRule = config.class11_12Rule.streamRules[streamId] || {
      startNumber: 1101,
      prefix: 'SCI-',
    };

    const existingStreamNumbers = store.examRollAssignments
      .filter((a) => a.streamId === streamId)
      .map((a) => {
        const digits = a.examRollNumber.replace(/\D/g, '');
        return digits ? parseInt(digits, 10) : NaN;
      })
      .filter((n) => !isNaN(n));

    const highest =
      existingStreamNumbers.length > 0
        ? Math.max(...existingStreamNumbers)
        : streamRule.startNumber - 1;

    let candidate = highest + 1;
    while (config.reservedNumbers.includes(candidate)) {
      candidate++;
    }

    return `${streamRule.prefix || ''}${candidate}`;
  }

  // Central school-wide numbering for Classes 1–10
  const existingCentralNumbers = store.examRollAssignments
    .map((a) => {
      const parsed = parseInt(a.examRollNumber, 10);
      return !isNaN(parsed) ? parsed : NaN;
    })
    .filter((n) => !isNaN(n));

  const highest =
    existingCentralNumbers.length > 0
      ? Math.max(...existingCentralNumbers)
      : config.class1_10Rule.startNumber - 1;

  let candidate = highest + 1;
  while (config.reservedNumbers.includes(candidate)) {
    candidate++;
  }

  return String(candidate);
}

export function validateRollNumberUniqueness(
  store: SchoolStoreState,
  proposedRoll: string,
  excludeStudentId?: string
): { isUnique: boolean; conflictingStudentName?: string } {
  const clean = proposedRoll.trim().toUpperCase();
  const existing = store.examRollAssignments.find(
    (a) => a.examRollNumber.trim().toUpperCase() === clean && a.studentId !== excludeStudentId
  );

  if (existing) {
    const student = store.students.find((s) => s.id === existing.studentId);
    return {
      isUnique: false,
      conflictingStudentName: student?.name || existing.studentId,
    };
  }

  return { isUnique: true };
}

export function previewBulkExamRollAllocation(
  store: SchoolStoreState,
  options: {
    academicSessionId?: string;
    campusIds?: string[];
    classIds?: string[];
    includeAlreadyAllocated?: boolean;
  }
): BulkAllocationPreviewResult {
  const { campusIds, classIds, includeAlreadyAllocated = false } = options;

  // Filter candidates
  const eligibleStudents = store.students.filter((std) => {
    if (std.status !== 'ACTIVE') return false;
    if (campusIds && campusIds.length > 0 && !campusIds.includes('ALL') && !campusIds.includes(std.campusId || '')) {
      return false;
    }
    if (classIds && classIds.length > 0 && !classIds.includes('ALL') && !classIds.includes(std.classId)) {
      return false;
    }

    const existingAssignment = store.examRollAssignments.find((a) => a.studentId === std.id);
    if (existingAssignment && !includeAlreadyAllocated) {
      return false;
    }

    return true;
  });

  const allocations: ProposedRollAllocation[] = [];
  const assignedInBatch = new Set<string>();

  // Track existing max per stream and general
  const streamCounters: Record<string, number> = {};
  store.streams.forEach((s) => {
    const streamRule = store.rollAllocationConfig.class11_12Rule.streamRules[s.id] || { startNumber: 1101 };
    const numbers = store.examRollAssignments
      .filter((a) => a.streamId === s.id)
      .map((a) => parseInt(a.examRollNumber.replace(/\D/g, ''), 10))
      .filter((n) => !isNaN(n));
    streamCounters[s.id] = numbers.length > 0 ? Math.max(...numbers) : streamRule.startNumber - 1;
  });

  const centralNumbers = store.examRollAssignments
    .map((a) => parseInt(a.examRollNumber, 10))
    .filter((n) => !isNaN(n));
  let generalCounter =
    centralNumbers.length > 0
      ? Math.max(...centralNumbers)
      : store.rollAllocationConfig.class1_10Rule.startNumber - 1;

  let newCount = 0;
  let unchangedCount = 0;
  let conflictCount = 0;

  eligibleStudents.forEach((std) => {
    const existingAssignment = store.examRollAssignments.find((a) => a.studentId === std.id);
    const campus = store.campuses.find((c) => c.id === std.campusId);
    const cls = store.classes.find((c) => c.id === std.classId);
    const sec = cls?.sections.find((s) => s.id === std.sectionId);
    const stream = store.streams.find((s) => s.id === std.streamId);

    if (existingAssignment) {
      // RULE 1 & 6: Existing assigned number remains unchanged!
      allocations.push({
        studentId: std.id,
        studentName: std.name,
        admissionNumber: std.admissionNumber,
        campusId: std.campusId || 'cmp-main',
        campusName: campus?.name || 'Main Campus',
        classId: std.classId,
        className: cls?.className || 'Class',
        sectionName: sec?.name || 'A',
        streamId: std.streamId,
        streamName: stream?.name,
        existingRollNumber: existingAssignment.examRollNumber,
        proposedRollNumber: existingAssignment.examRollNumber,
        isNewAllocation: false,
        status: 'UNCHANGED',
      });
      unchangedCount++;
    } else {
      // Allocate next available stable number
      let candidateRoll = '';
      const isSenior = std.classId === 'cls-11' || std.classId === 'cls-12';

      if (isSenior && std.streamId && store.rollAllocationConfig.class11_12Rule.streamAware) {
        const streamRule = store.rollAllocationConfig.class11_12Rule.streamRules[std.streamId] || {
          prefix: 'SCI-',
        };
        streamCounters[std.streamId]++;
        candidateRoll = `${streamRule.prefix || ''}${streamCounters[std.streamId]}`;
      } else {
        generalCounter++;
        while (store.rollAllocationConfig.reservedNumbers.includes(generalCounter)) {
          generalCounter++;
        }
        candidateRoll = String(generalCounter);
      }

      // Check conflict
      const uniqueness = validateRollNumberUniqueness(store, candidateRoll);
      let status: ProposedRollAllocation['status'] = 'READY';
      let conflictMsg: string | undefined;

      if (!uniqueness.isUnique || assignedInBatch.has(candidateRoll)) {
        status = 'CONFLICT';
        conflictMsg = `Collision with ${uniqueness.conflictingStudentName || 'batch reservation'}`;
        conflictCount++;
      } else {
        assignedInBatch.add(candidateRoll);
        newCount++;
      }

      allocations.push({
        studentId: std.id,
        studentName: std.name,
        admissionNumber: std.admissionNumber,
        campusId: std.campusId || 'cmp-main',
        campusName: campus?.name || 'Main Campus',
        classId: std.classId,
        className: cls?.className || 'Class',
        sectionName: sec?.name || 'A',
        streamId: std.streamId,
        streamName: stream?.name,
        existingRollNumber: null,
        proposedRollNumber: candidateRoll,
        isNewAllocation: true,
        status,
        conflictMessage: conflictMsg,
      });
    }
  });

  return {
    allocations,
    totalEligible: eligibleStudents.length,
    newAllocationsCount: newCount,
    unchangedCount,
    conflictsCount: conflictCount,
  };
}
