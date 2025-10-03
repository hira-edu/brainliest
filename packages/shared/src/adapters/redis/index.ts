import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { env } from '@brainliest/config/env.server';

declare global {
  // eslint-disable-next-line no-var
  var __brainliestRedisClient: Redis | undefined;
}

const { REDIS_URL } = env;

const baseOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

if (REDIS_URL.startsWith('rediss://')) {
  baseOptions.tls = {
    rejectUnauthorized: false,
  };
}

const redisClient =
  globalThis.__brainliestRedisClient ?? new Redis(REDIS_URL, baseOptions);

redisClient.on('error', (error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[redis] connection error', error);
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__brainliestRedisClient = redisClient;
}

export const redis = redisClient;
