import Redis from 'ioredis';

let redisInstance: Redis | null = null;
let isConnected = false;

export function isProductionMode(): boolean {
  return process.env.AUTH_INFRA_MODE === 'production' || process.env.NODE_ENV === 'production';
}

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;

  // In local mode without REDIS_URL, return null for graceful in-memory fallback
  if (!redisUrl || redisUrl.trim() === '' || redisUrl === 'redis://localhost:6379/placeholder') {
    if (isProductionMode()) {
      console.warn('[REDIS_SECURITY] REDIS_URL is required in production mode!');
    }
    return null;
  }

  if (!redisInstance) {
    try {
      redisInstance = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
          if (times > 3) {
            return null; // Stop retrying after 3 attempts
          }
          return Math.min(times * 100, 1000);
        },
        enableOfflineQueue: false,
        lazyConnect: false,
      });

      redisInstance.on('connect', () => {
        isConnected = true;
      });

      redisInstance.on('ready', () => {
        isConnected = true;
      });

      redisInstance.on('error', (err) => {
        isConnected = false;
        // Never log Redis credentials or connection strings
        console.error('[REDIS_ERROR] Redis client connection error:', err.message || 'Connection failed');
      });

      redisInstance.on('close', () => {
        isConnected = false;
      });
    } catch {
      console.error('[REDIS_INITIALIZATION_ERROR] Failed to instantiate Redis client');
      redisInstance = null;
      isConnected = false;
    }
  }

  return redisInstance;
}

export function isRedisHealthy(): boolean {
  return isConnected && redisInstance !== null;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    try {
      await redisInstance.quit();
    } catch {
      redisInstance.disconnect();
    } finally {
      redisInstance = null;
      isConnected = false;
    }
  }
}
