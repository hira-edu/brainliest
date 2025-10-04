import { NextResponse } from 'next/server';
import { AdminUnauthorizedError } from './admin-actor';

export function handleAdminRouteError(error: unknown) {
  if (error instanceof AdminUnauthorizedError) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  return null;
}
