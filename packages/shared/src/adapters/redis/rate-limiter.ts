import { redisKeys } from '@brainliest/config/redis-keys';
import { redis } from './index';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
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
