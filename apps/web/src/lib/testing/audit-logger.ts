/**
 * Rivo Production Testing & Observability Center
 * Operator Audit Logger and Observability Log Stream
 */

export interface TestingLogEntry {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  action: string;
  operator: string;
  targetUrl: string;
  message: string;
  details?: any;
}

// In-memory bounded circular log buffer for instant dashboard streaming
const MAX_LOG_BUFFER_SIZE = 500;
const logBuffer: TestingLogEntry[] = [];

export function recordAuditLog(entry: Omit<TestingLogEntry, 'id' | 'timestamp'>): TestingLogEntry {
  const fullEntry: TestingLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };

  logBuffer.unshift(fullEntry);
  if (logBuffer.length > MAX_LOG_BUFFER_SIZE) {
    logBuffer.pop();
  }

  // Also log to console for container/serverless runtime log drains
  const prefix = `[TESTING_AUDIT][${fullEntry.severity}][${fullEntry.service}]`;
  if (fullEntry.severity === 'ERROR') {
    console.error(prefix, fullEntry.action, fullEntry.message);
  } else if (fullEntry.severity === 'WARN') {
    console.warn(prefix, fullEntry.action, fullEntry.message);
  } else {
    console.log(prefix, fullEntry.action, fullEntry.message);
  }

  return fullEntry;
}

export function getAuditLogs(options?: {
  limit?: number;
  severity?: string;
  service?: string;
  search?: string;
}): TestingLogEntry[] {
  let filtered = [...logBuffer];

  if (options?.severity) {
    filtered = filtered.filter((l) => l.severity.toLowerCase() === options.severity?.toLowerCase());
  }

  if (options?.service) {
    filtered = filtered.filter((l) => l.service.toLowerCase().includes(options.service!.toLowerCase()));
  }

  if (options?.search) {
    const s = options.search.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.message.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        l.operator.toLowerCase().includes(s)
    );
  }

  const limit = options?.limit || 100;
  return filtered.slice(0, limit);
}
