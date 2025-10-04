import { NextResponse } from 'next/server';
import type { AdminUserFilter } from '@brainliest/db';
import { searchAdminUsersSuggestions } from '@/lib/admin-users';
import { requireAdminActor } from '@/lib/auth';
import { handleAdminRouteError } from '@/lib/auth/error-response';

const MIN_QUERY_LENGTH = 2;
const ADMIN_ROLES: readonly NonNullable<AdminUserFilter['role']>[] = ['VIEWER', 'EDITOR', 'ADMIN', 'SUPERADMIN'];
const ROLE_SET = new Set(ADMIN_ROLES);
const STATUS_OPTIONS = new Set(['active', 'invited', 'suspended']);

export async function GET(request: Request) {
  try {
    await requireAdminActor();

    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') ?? '').trim();
    const roleParam = (searchParams.get('role') ?? '').toUpperCase();
    const statusParam = (searchParams.get('status') ?? '').toLowerCase();
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(20, Number.parseInt(limitParam, 10))) : 6;

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ suggestions: [] });
    }

    const role = ROLE_SET.has(roleParam as NonNullable<AdminUserFilter['role']>)
      ? (roleParam as NonNullable<AdminUserFilter['role']>)
      : undefined;

    const status = STATUS_OPTIONS.has(statusParam) ? statusParam : undefined;

    const suggestions = await searchAdminUsersSuggestions(query, limit, {
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
    });

    return NextResponse.json({
      suggestions: suggestions.map((admin) => ({
        value: admin.email,
        label: `${admin.role} • ${admin.id.slice(0, 8)}...`,
      })),
    });
  } catch (error) {
    const unauthorized = handleAdminRouteError(error);
    if (unauthorized) {
      return unauthorized;
    }

    console.error('[api/search/admin-users] failed to provide suggestions', error);
    return NextResponse.json({ suggestions: [] }, { status: 500 });
  }
}
