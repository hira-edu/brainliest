import 'server-only';

import { headers } from 'next/headers';

import { repositories } from '../repositories';
import { readSession } from './session';

export interface AdminActor {
  readonly id: string;
  readonly email: string | null;
  readonly role: string | null;
  readonly source: 'header' | 'cookie' | 'lookup';
  readonly sessionId?: string | null;
}

export class AdminUnauthorizedError extends Error {
  constructor(message = 'Admin authentication required.') {
    super(message);
    this.name = 'AdminUnauthorizedError';
  }
}

async function findAdminByEmail(email: string): Promise<AdminActor | null> {
  const record = await repositories.adminUsers.findByEmail(email.toLowerCase());

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    email: record.email,
    role: record.role,
    source: 'lookup',
    sessionId: null,
  } satisfies AdminActor;
}

async function getSessionActor(): Promise<AdminActor | null> {
  const session = await readSession();
  if (!session) {
    return null;
  }

  return {
    id: session.adminId,
    email: session.email,
    role: session.role,
    source: 'cookie',
    sessionId: session.sessionId,
  } satisfies AdminActor;
}

export async function getAdminActor(): Promise<AdminActor | null> {
  const headerStore = await headers();

  const headerId = headerStore.get('x-admin-id');
  const headerEmail = headerStore.get('x-admin-email');
  const headerRole = headerStore.get('x-admin-role');

  if (headerId) {
    return {
      id: headerId,
      email: headerEmail ?? null,
      role: headerRole ?? null,
      source: 'header',
      sessionId: null,
    } satisfies AdminActor;
  }

  const sessionActor = await getSessionActor();
  if (sessionActor) {
    return sessionActor;
  }

  const candidateEmail = headerEmail ?? null;
  if (candidateEmail) {
    const resolved = await findAdminByEmail(candidateEmail);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export async function requireAdminActor(): Promise<AdminActor> {
  const actor = await getAdminActor();
  if (!actor) {
    throw new AdminUnauthorizedError();
  }
  return actor;
}
