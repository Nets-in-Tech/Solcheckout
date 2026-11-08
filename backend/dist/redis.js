"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
exports.getCached = getCached;
exports.setCached = setCached;
exports.deleteCached = deleteCached;
exports.acquireLock = acquireLock;
exports.releaseLock = releaseLock;
const redis_1 = require("redis");
const config_js_1 = require("./config.js");
exports.redisClient = config_js_1.config.redisUrl
    ? (0, redis_1.createClient)({
        url: config_js_1.config.redisUrl,
    })
    : null;
if (exports.redisClient) {
    exports.redisClient.on('error', (err) => {
        console.warn('Redis Client Error:', err.message);
    });
    exports.redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });
}
async function connectRedis(retries = 5, delay = 1000) {
    if (!exports.redisClient)
        return false;
    for (let i = 0; i < retries; i++) {
        try {
            if (!exports.redisClient.isOpen) {
                await exports.redisClient.connect();
            }
            await exports.redisClient.ping();
            return true;
        }
        catch (err) {
            console.log(`⏳ Waiting for Redis to be ready (${i + 1}/${retries})... ${err.message}`);
            await new Promise((res) => setTimeout(res, delay));
        }
    }
    console.warn('⚠️ Redis not available, falling back to direct DB operations.');
    return false;
}
// Redis Helper functions
async function getCached(key) {
    try {
        if (!exports.redisClient || !exports.redisClient.isOpen)
            return null;
        const data = await exports.redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch (err) {
        console.warn(`Redis get error for key ${key}:`, err);
        return null;
    }
}
async function setCached(key, value, ttlSeconds = 300) {
    try {
        if (!exports.redisClient || !exports.redisClient.isOpen)
            return;
        await exports.redisClient.set(key, JSON.stringify(value), { EX: ttlSeconds });
    }
    catch (err) {
        console.warn(`Redis set error for key ${key}:`, err);
    }
}
async function deleteCached(key) {
    try {
        if (!exports.redisClient || !exports.redisClient.isOpen)
            return;
        await exports.redisClient.del(key);
    }
    catch (err) {
        console.warn(`Redis del error for key ${key}:`, err);
    }
}
// Atomic lock helper for order verification to prevent double-fulfillment
async function acquireLock(key, ttlSeconds = 10) {
    try {
        if (!exports.redisClient || !exports.redisClient.isOpen)
            return true;
        const result = await exports.redisClient.set(`lock:${key}`, 'locked', {
            NX: true,
            EX: ttlSeconds,
        });
        return result === 'OK';
    }
    catch {
        return true;
    }
}
async function releaseLock(key) {
    try {
        if (!exports.redisClient || !exports.redisClient.isOpen)
            return;
        await exports.redisClient.del(`lock:${key}`);
    }
    catch { }
}
