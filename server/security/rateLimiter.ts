import { Request } from 'express';
import { logSecurityEvent } from './auditLogger';

export function getClientIp(req: Request): string {
  // 1. Cloudflare True-Client-IP / CF-Connecting-IP
  const cfIp = req.headers['cf-connecting-ip'] || req.headers['true-client-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) {
    return cfIp.trim().split(',')[0].trim();
  }

  // 2. Standard X-Forwarded-For (first entry is the client IP)
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  // 3. Nginx X-Real-IP
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  // 4. Socket remote address
  return req.socket?.remoteAddress || req.ip || '127.0.0.1';
}

interface SlidingRateRecord {
  timestamps: number[];
  failedAttempts: number;
  blockedUntil: number;
}

const rateLimitStore = new Map<string, SlidingRateRecord>();

// Clean up expired records every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 600000); // 10 min window
    if (record.timestamps.length === 0 && now > record.blockedUntil && record.failedAttempts === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 120000);

export interface RateLimitCheckResult {
  allowed: boolean;
  retryAfterSec: number;
  currentAttempts: number;
  maxAttempts: number;
}

/**
 * Multi-Tier Rate Limiting with Exponential Backoff
 * @param key unique limiter key (e.g., ip:192.168.1.1 or account:user@example.com)
 * @param maxAttempts maximum requests allowed in windowMs
 * @param windowMs time window in milliseconds
 * @param isAccountLevel whether this is an account-level check that uses exponential backoff
 */
export function checkMultiTierRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  isAccountLevel = false
): RateLimitCheckResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [], failedAttempts: 0, blockedUntil: 0 };
    rateLimitStore.set(key, record);
  }

  // Check if currently blocked
  if (now < record.blockedUntil) {
    const retryAfterSec = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSec,
      currentAttempts: record.timestamps.length,
      maxAttempts,
    };
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    // Calculate backoff
    let blockDurationMs = windowMs;
    if (isAccountLevel) {
      // Exponential backoff: 5s, 10s, 20s, 40s, 80s up to 5 min
      const factor = Math.min(record.failedAttempts || 1, 6);
      blockDurationMs = Math.min(300000, 5000 * Math.pow(2, factor - 1));
    }

    record.blockedUntil = now + blockDurationMs;
    const retryAfterSec = Math.ceil(blockDurationMs / 1000);

    return {
      allowed: false,
      retryAfterSec,
      currentAttempts: record.timestamps.length,
      maxAttempts,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    retryAfterSec: 0,
    currentAttempts: record.timestamps.length,
    maxAttempts,
  };
}

/**
 * Record a failed attempt for an account key to increase exponential backoff
 */
export function recordFailedAuthAttempt(accountKey: string, ip: string): void {
  const record = rateLimitStore.get(accountKey);
  if (record) {
    record.failedAttempts += 1;
    if (record.failedAttempts >= 3) {
      const backoffMs = Math.min(300000, 5000 * Math.pow(2, Math.min(record.failedAttempts - 2, 6)));
      record.blockedUntil = Date.now() + backoffMs;
      logSecurityEvent({
        eventType: 'AUTH_BRUTE_FORCE_BLOCKED',
        severity: 'WARN',
        ip,
        identifier: accountKey,
        details: { failedAttempts: record.failedAttempts, backoffSeconds: Math.ceil(backoffMs / 1000) },
      });
    }
  }
}

/**
 * Reset failed attempts on successful authentication
 */
export function resetAuthAttempts(accountKey: string): void {
  const record = rateLimitStore.get(accountKey);
  if (record) {
    record.failedAttempts = 0;
    record.blockedUntil = 0;
  }
}
