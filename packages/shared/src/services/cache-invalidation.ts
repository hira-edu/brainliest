/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { revalidateTag } from 'next/cache';
import { redisKeys } from '@brainliest/config/redis-keys';
import { redis } from '../adapters/redis';

export async function invalidateExam(examSlug: string): Promise<void> {
  await redis.del(redisKeys.examMeta(examSlug));
  revalidateTag(`exam:${examSlug}`);
}

export async function invalidateCategory(_categorySlug: string): Promise<void> {
  void _categorySlug;
  await redis.del(redisKeys.categoryTree());
  revalidateTag('categories');
}
