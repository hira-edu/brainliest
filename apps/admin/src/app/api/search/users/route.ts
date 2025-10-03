import { NextResponse } from 'next/server';
import type { UserRoleValue } from '@brainliest/db';
import { searchUsersSuggestions } from '@/lib/users';

const MIN_QUERY_LENGTH = 2;
const USER_ROLES: readonly UserRoleValue[] = ['STUDENT', 'EDITOR', 'ADMIN', 'SUPERADMIN'];
const ROLE_SET = new Set(USER_ROLES);
const STATUS_OPTIONS = new Set(['active', 'suspended', 'banned']);
const SUBSCRIPTION_OPTIONS = new Set(['free', 'standard', 'premium', 'team']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') ?? '').trim();
  const roleParam = (searchParams.get('role') ?? '').toUpperCase();
  const statusParam = (searchParams.get('status') ?? '').toLowerCase();
  const subscriptionParam = (searchParams.get('subscription') ?? '').toLowerCase();
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.max(1, Math.min(20, Number.parseInt(limitParam, 10))) : 6;

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  const role = ROLE_SET.has(roleParam as UserRoleValue) ? (roleParam as UserRoleValue) : undefined;

  const status = STATUS_OPTIONS.has(statusParam) ? statusParam : undefined;

  const subscription = SUBSCRIPTION_OPTIONS.has(subscriptionParam) ? subscriptionParam : undefined;

  const suggestions = await searchUsersSuggestions(query, limit, {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(subscription ? { subscriptionTier: subscription } : {}),
  });

  return NextResponse.json({
    suggestions: suggestions.map((user) => ({
      value: user.email,
      label: `${user.status} • ${user.id.slice(0, 8)}...`,
    })),
  });
}
