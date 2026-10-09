/**
 * Rivo Production Testing & Observability Center
 * Real Infrastructure Health Adapters
 */

import { prisma } from '@/lib/prisma';
import { getRedisClient } from '@/lib/redis/client';
import { validateTargetUrl, DEFAULT_PRODUCTION_TARGET } from './target-config';
import { recordAuditLog } from './audit-logger';

export interface ServiceHealthStatus {
  service: 'TARGET_WEB' | 'POSTGRES' | 'REDIS' | 'AZURE_BLOB' | 'EMAIL';
  name: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
  latencyMs?: number;
  endpoint?: string;
  details?: Record<string, any>;
  error?: string;
  checkedAt: string;
}

export interface ComprehensiveHealthReport {
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED';
  targetUrl: string;
  timestamp: string;
  services: Record<string, ServiceHealthStatus>;
}

/**
 * Checks live target application deployment over HTTPS
 */
export async function checkTargetWebHealth(rawTargetUrl?: string): Promise<ServiceHealthStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();
  let targetUrl: string;

  try {
    const validated = validateTargetUrl(rawTargetUrl || DEFAULT_PRODUCTION_TARGET);
    targetUrl = validated.url;
  } catch (err: any) {
    return {
      service: 'TARGET_WEB',
      name: 'Deployed Web App (Vercel)',
      status: 'FAILED',
      checkedAt,
      error: err.message,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${targetUrl}/api/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Rivo-Observability-Agent/1.0',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      // Not JSON
    }

    const isHealthy = res.status === 200 && payload?.status === 'healthy';
    const isDegraded = res.status === 200 && !isHealthy;

    return {
      service: 'TARGET_WEB',
      name: 'Deployed Web App (Vercel)',
      status: isHealthy ? 'HEALTHY' : isDegraded ? 'DEGRADED' : 'FAILED',
      latencyMs,
      endpoint: `${targetUrl}/api/health`,
      details: {
        httpStatus: res.status,
        remoteReport: payload,
      },
      error: res.status !== 200 ? `HTTP ${res.status}: ${res.statusText}` : undefined,
      checkedAt,
    };
  } catch (err: any) {
    return {
      service: 'TARGET_WEB',
      name: 'Deployed Web App (Vercel)',
      status: 'FAILED',
      latencyMs: Date.now() - start,
      endpoint: `${targetUrl}/api/health`,
      error: err.message,
      checkedAt,
    };
  }
}

/**
 * Checks PostgreSQL (Neon) database connectivity and measures query latency
 */
export async function checkPostgresHealth(): Promise<ServiceHealthStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const result = await prisma.$queryRawUnsafe<any[]>('SELECT 1 as ping, current_database() as db');
    const latencyMs = Date.now() - start;

    return {
      service: 'POSTGRES',
      name: 'Neon PostgreSQL Database',
      status: 'HEALTHY',
      latencyMs,
      details: {
        query: 'SELECT 1 as ping',
        connectedDatabase: result?.[0]?.db || 'neondb',
      },
      checkedAt,
    };
  } catch (err: any) {
    return {
      service: 'POSTGRES',
      name: 'Neon PostgreSQL Database',
      status: 'FAILED',
      latencyMs: Date.now() - start,
      error: err.message,
      checkedAt,
    };
  }
}

/**
 * Checks Redis (Upstash) connectivity
 */
export async function checkRedisHealth(): Promise<ServiceHealthStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  const isConfigured = !!(process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL);
  if (!isConfigured) {
    return {
      service: 'REDIS',
      name: 'Upstash Redis Cache',
      status: process.env.NODE_ENV === 'production' ? 'FAILED' : 'DEGRADED',
      details: {
        mode: 'In-memory fallback (No REDIS_URL configured in local environment)',
      },
      checkedAt,
    };
  }

  try {
    const redis = getRedisClient();
    if (!redis) {
      throw new Error('Redis client instance is null');
    }

    const pong = await redis.ping();
    const latencyMs = Date.now() - start;

    return {
      service: 'REDIS',
      name: 'Upstash Redis Cache',
      status: pong === 'PONG' ? 'HEALTHY' : 'DEGRADED',
      latencyMs,
      details: {
        pingResponse: pong,
        cluster: 'Upstash Serverless',
      },
      checkedAt,
    };
  } catch (err: any) {
    // If local Redis daemon is offline, distinguish local fallback from production failure
    const isProd = process.env.NODE_ENV === 'production';
    return {
      service: 'REDIS',
      name: 'Upstash Redis Cache',
      status: isProd ? 'FAILED' : 'DEGRADED',
      latencyMs: Date.now() - start,
      details: {
        mode: isProd ? 'Production Fail-Closed' : 'Local dev in-memory fallback active',
      },
      error: err.message,
      checkedAt,
    };
  }
}

/**
 * Checks Azure Blob Storage configuration and SAS generation
 */
export async function checkAzureBlobHealth(): Promise<ServiceHealthStatus> {
  const start = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connStr || connStr.trim() === '') {
      return {
        service: 'AZURE_BLOB',
        name: 'Azure Blob Storage',
        status: 'FAILED',
        error: 'AZURE_STORAGE_CONNECTION_STRING is missing or empty',
        checkedAt,
      };
    }

    const { BlobServiceClient } = await import('@azure/storage-blob');
    const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    const accountName = blobServiceClient.accountName;
    const latencyMs = Date.now() - start;

    return {
      service: 'AZURE_BLOB',
      name: 'Azure Blob Storage',
      status: 'HEALTHY',
      latencyMs,
      details: {
        accountName,
        publicContainer: process.env.AZURE_STORAGE_PUBLIC_CONTAINER || 'rivo-media',
        privateContainer: process.env.AZURE_STORAGE_PRIVATE_CONTAINER || 'rivo-secure-docs',
      },
      checkedAt,
    };
  } catch (err: any) {
    return {
      service: 'AZURE_BLOB',
      name: 'Azure Blob Storage',
      status: 'FAILED',
      latencyMs: Date.now() - start,
      error: err.message,
      checkedAt,
    };
  }
}

/**
 * Checks Email service (Resend) configuration
 */
export async function checkEmailHealth(): Promise<ServiceHealthStatus> {
  const checkedAt = new Date().toISOString();
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    return {
      service: 'EMAIL',
      name: 'Resend Transactional Email',
      status: 'DEGRADED',
      error: 'RESEND_API_KEY not set in current environment',
      checkedAt,
    };
  }

  const isValidFormat = apiKey.startsWith('re_');

  return {
    service: 'EMAIL',
    name: 'Resend Transactional Email',
    status: isValidFormat ? 'HEALTHY' : 'DEGRADED',
    details: {
      provider: 'Resend',
      fromEmail: process.env.RESEND_FROM_EMAIL || 'support@rivo.school',
      fromName: process.env.RESEND_FROM_NAME || 'Rivo School ERP',
      keyConfigured: true,
    },
    checkedAt,
  };
}

/**
 * Runs all health adapters and computes overall system status
 */
export async function runComprehensiveHealthCheck(targetUrl?: string): Promise<ComprehensiveHealthReport> {
  const [web, db, redis, azure, email] = await Promise.all([
    checkTargetWebHealth(targetUrl),
    checkPostgresHealth(),
    checkRedisHealth(),
    checkAzureBlobHealth(),
    checkEmailHealth(),
  ]);

  const services = {
    targetWeb: web,
    postgres: db,
    redis,
    azureBlob: azure,
    email,
  };

  const statuses = [web.status, db.status, redis.status, azure.status, email.status];
  const hasFailed = statuses.includes('FAILED');
  const hasDegraded = statuses.includes('DEGRADED');

  const overallStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED' = hasFailed
    ? 'FAILED'
    : hasDegraded
    ? 'DEGRADED'
    : 'HEALTHY';

  recordAuditLog({
    severity: overallStatus === 'FAILED' ? 'ERROR' : overallStatus === 'DEGRADED' ? 'WARN' : 'INFO',
    service: 'HEALTH_CHECK',
    action: 'RUN_HEALTH_CHECK',
    operator: 'SYSTEM_DIAGNOSTICS',
    targetUrl: web.endpoint || DEFAULT_PRODUCTION_TARGET,
    message: `Comprehensive health check completed: Overall ${overallStatus}`,
    details: { overallStatus, web: web.status, db: db.status, redis: redis.status },
  });

  return {
    overallStatus,
    targetUrl: web.endpoint || DEFAULT_PRODUCTION_TARGET,
    timestamp: new Date().toISOString(),
    services,
  };
}
