import { redisKeys } from '@brainliest/config/redis-keys';
import { redis } from './index';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export interface ConsumeRateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

export interface ConsumeRateLimitResult extends RateLimitResult {
  totalHits: number;
  retryAfterSeconds: number;
}

export async function checkAiRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = redisKeys.rateLimitAi(identifier);

  // Token bucket: 5 per minute, 50 per day
  const minuteKey = `${key}:minute`;
  const dayKey = `${key}:day`;

  const [minuteCount, dayCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(dayKey),
  ]);

  if (minuteCount === 1) {
    await redis.expire(minuteKey, 60);
  }
  if (dayCount === 1) {
    await redis.expire(dayKey, 86400);
  }

  return {
    allowed: minuteCount <= 5 && dayCount <= 50,
    remaining: Math.min(5 - minuteCount, 50 - dayCount),
  };
}

export async function consumeRateLimit({
  key,
  limit,
  windowSeconds,
}: ConsumeRateLimitOptions): Promise<ConsumeRateLimitResult> {
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (count > limit) {
    const ttl = await redis.ttl(key);
    const retryAfterSeconds = ttl >= 0 ? ttl : windowSeconds;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      totalHits: count,
    };
  }

  const ttl = await redis.ttl(key);
  return {
    allowed: true,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: ttl >= 0 ? ttl : windowSeconds,
    totalHits: count,
  };
}
