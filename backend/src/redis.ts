import { createClient } from 'redis';
import { config } from './config.js';

export const redisClient = config.redisUrl
  ? createClient({
      url: config.redisUrl,
    })
  : null;

if (redisClient) {
  redisClient.on('error', (err) => {
    console.warn('Redis Client Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected successfully');
  });
}

export async function connectRedis(retries = 5, delay = 1000): Promise<boolean> {
  if (!redisClient) return false;
  for (let i = 0; i < retries; i++) {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
      await redisClient.ping();
      return true;
    } catch (err: any) {
      console.log(`⏳ Waiting for Redis to be ready (${i + 1}/${retries})... ${err.message}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.warn('⚠️ Redis not available, falling back to direct DB operations.');
  return false;
}

// Redis Helper functions
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (!redisClient || !redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`Redis get error for key ${key}:`, err);
    return null;
  }
}

export async function setCached(key: string, value: any, ttlSeconds = 300): Promise<void> {
  try {
    if (!redisClient || !redisClient.isOpen) return;
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    console.warn(`Redis set error for key ${key}:`, err);
  }
}

export async function deleteCached(key: string): Promise<void> {
  try {
    if (!redisClient || !redisClient.isOpen) return;
    await redisClient.del(key);
  } catch (err) {
    console.warn(`Redis del error for key ${key}:`, err);
  }
}

// Atomic lock helper for order verification to prevent double-fulfillment
export async function acquireLock(key: string, ttlSeconds = 10): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) return true;
    const result = await redisClient.set(`lock:${key}`, 'locked', {
      NX: true,
      EX: ttlSeconds,
    });
    return result === 'OK';
  } catch {
    return true;
  }
}

export async function releaseLock(key: string): Promise<void> {
  try {
    if (!redisClient || !redisClient.isOpen) return;
    await redisClient.del(`lock:${key}`);
  } catch {}
}
