import { ExamScheduleEntry } from '../types';
import { SchoolStoreState } from '../mock-store/school-store';

export type ExamConflictSeverity = 'CRITICAL' | 'WARNING';

export interface ExamConflict {
  id: string;
  severity: ExamConflictSeverity;
  type:
    | 'COHORT_OVERLAP'
    | 'ROOM_COLLISION'
    | 'DUPLICATE_SLOT'
    | 'INVALID_TIME'
    | 'INACTIVE_ENTITY'
    | 'STREAM_MISMATCH';
  title: string;
  description: string;
  scheduleEntryIdA: string;
  scheduleEntryIdB?: string;
  paperNameA?: string;
  paperNameB?: string;
  suggestion: string;
}

// Convert "HH:mm" to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

function checkTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const a1 = timeToMinutes(startA);
  const a2 = timeToMinutes(endA);
  const b1 = timeToMinutes(startB);
  const b2 = timeToMinutes(endB);
  return Math.max(a1, b1) < Math.min(a2, b2);
}

export function detectExamScheduleConflicts(
  store: SchoolStoreState,
  entries: ExamScheduleEntry[],
  currentEntryCandidate?: Partial<ExamScheduleEntry>
): ExamConflict[] {
  const conflicts: ExamConflict[] = [];

  const allEntries = currentEntryCandidate && currentEntryCandidate.date && currentEntryCandidate.startTime && currentEntryCandidate.endTime
    ? [...entries.filter((e) => e.id !== currentEntryCandidate.id), currentEntryCandidate as ExamScheduleEntry]
    : entries;

  const getPaper = (paperId: string) => store.examPapers.find((p) => p.id === paperId);
  const getSubject = (paperId: string) => {
    const p = getPaper(paperId);
    return store.subjects.find((s) => s.id === p?.subjectId);
  };

  // 1. Check entry-level integrity
  allEntries.forEach((entry) => {
    const startM = timeToMinutes(entry.startTime);
    const endM = timeToMinutes(entry.endTime);
    if (endM <= startM) {
      conflicts.push({
        id: `conf-time-${entry.id}`,
        severity: 'CRITICAL',
        type: 'INVALID_TIME',
        title: 'Invalid Exam Duration',
        description: `Scheduled end time (${entry.endTime}) must be strictly after start time (${entry.startTime}).`,
        scheduleEntryIdA: entry.id,
        suggestion: 'Adjust the start or end time so the paper has a positive duration.',
      });
    }

    // Check inactive campus
    entry.campusIds.forEach((cmpId) => {
      const cmp = store.campuses.find((c) => c.id === cmpId);
      if (cmp && cmp.status === 'INACTIVE') {
        conflicts.push({
          id: `conf-cmp-inactive-${entry.id}-${cmpId}`,
          severity: 'WARNING',
          type: 'INACTIVE_ENTITY',
          title: 'Inactive Campus Selected',
          description: `Campus "${cmp.name}" is marked inactive. Candidates from this campus might not be reachable.`,
          scheduleEntryIdA: entry.id,
          suggestion: 'Confirm whether this campus should be included or reactivate it in School Settings.',
        });
      }
    });

    // Check inactive subject
    const paper = getPaper(entry.paperId);
    const subj = getSubject(paper?.subjectId || entry.paperId);
    if (subj && subj.status === 'INACTIVE') {
      conflicts.push({
        id: `conf-sub-inactive-${entry.id}`,
        severity: 'WARNING',
        type: 'INACTIVE_ENTITY',
        title: 'Inactive Subject Selected',
        description: `Subject "${subj.name}" is inactive in the central curriculum catalog.`,
        scheduleEntryIdA: entry.id,
        suggestion: 'Reactivate the subject or choose an active course paper.',
      });
    }
  });

  // 2. Check pairwise collisions (Overlap on same date)
  for (let i = 0; i < allEntries.length; i++) {
    for (let j = i + 1; j < allEntries.length; j++) {
      const a = allEntries[i];
      const b = allEntries[j];

      // Must be same date to conflict
      if (a.date !== b.date) continue;

      const isTimeOverlapping = checkTimeOverlap(a.startTime, a.endTime, b.startTime, b.endTime);
      if (!isTimeOverlapping) continue;

      const paperA = getPaper(a.paperId);
      const paperB = getPaper(b.paperId);
      const subjA = getSubject(a.paperId);
      const subjB = getSubject(b.paperId);

      const paperNameA = subjA?.name || paperA?.paperCode || 'Paper A';
      const paperNameB = subjB?.name || paperB?.paperCode || 'Paper B';

      // Check Room Collision in same campus
      const commonCampuses = a.campusIds.filter((id) => b.campusIds.includes(id));
      if (
        commonCampuses.length > 0 &&
        a.room.trim().toLowerCase() === b.room.trim().toLowerCase() &&
        a.room.trim() !== ''
      ) {
        conflicts.push({
          id: `conf-room-${a.id}-${b.id}`,
          severity: 'CRITICAL',
          type: 'ROOM_COLLISION',
          title: 'Examination Room Double-Booking',
          description: `Room "${a.room}" is assigned simultaneously to both "${paperNameA}" (${a.startTime}–${a.endTime}) and "${paperNameB}" (${b.startTime}–${b.endTime}) on ${a.date}.`,
          scheduleEntryIdA: a.id,
          scheduleEntryIdB: b.id,
          paperNameA,
          paperNameB,
          suggestion: 'Change the room or adjust timeslots to prevent hall overcrowding.',
        });
      }

      // Check Cohort Overlap: Same Class & (no stream OR common stream)
      const commonClasses = a.classIds.filter((id) => b.classIds.includes(id));
      if (commonClasses.length > 0) {
        let streamCollision = false;
        // If neither specifies stream, all students in that class are booked -> collision!
        if (!a.streamIds?.length && !b.streamIds?.length) {
          streamCollision = true;
        } else if (!a.streamIds?.length || !b.streamIds?.length) {
          // One applies to all students, one applies to a stream -> collision!
          streamCollision = true;
        } else {
          // Both specify streams: check intersection
          const commonStreams = a.streamIds.filter((id) => b.streamIds?.includes(id));
          if (commonStreams.length > 0) {
            streamCollision = true;
          }
        }

        if (streamCollision) {
          const classNames = commonClasses
            .map((cId) => store.classes.find((c) => c.id === cId)?.className || cId)
            .join(', ');

          conflicts.push({
            id: `conf-cohort-${a.id}-${b.id}`,
            severity: 'CRITICAL',
            type: 'COHORT_OVERLAP',
            title: 'Student Cohort Overlap',
            description: `Students in ${classNames} are assigned to both "${paperNameA}" and "${paperNameB}" at overlapping times (${a.startTime}–${a.endTime} vs ${b.startTime}–${b.endTime}) on ${a.date}.`,
            scheduleEntryIdA: a.id,
            scheduleEntryIdB: b.id,
            paperNameA,
            paperNameB,
            suggestion: 'Reschedule one paper to a distinct morning/afternoon shift or another exam date.',
          });
        }
      }
    }
  }

  return conflicts;
}
