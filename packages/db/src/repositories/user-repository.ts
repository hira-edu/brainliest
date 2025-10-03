import type { PaginatedResult, UserId } from '../types';

export type UserRoleValue = 'STUDENT' | 'EDITOR' | 'ADMIN' | 'SUPERADMIN';

export interface UserRecord {
  readonly id: UserId;
  readonly email: string;
  readonly role: UserRoleValue;
  readonly status: string;
  readonly profile: Record<string, unknown>;
  readonly emailVerifiedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CreateUserInput {
  readonly email: string;
  readonly hashedPassword: string;
  readonly role: UserRoleValue;
  readonly status?: string;
  readonly profile?: Record<string, unknown>;
}

export interface UpdateUserInput extends Partial<CreateUserInput> {
  readonly id: UserId;
}

export interface UserFilter {
  readonly role?: UserRoleValue;
  readonly status?: string;
  readonly subscriptionTier?: string;
  readonly search?: string;
}

export interface UserRepository {
  findById(id: UserId): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  list(filters: UserFilter, page: number, pageSize: number): Promise<PaginatedResult<UserRecord>>;
  create(input: CreateUserInput): Promise<UserId>;
  update(input: UpdateUserInput): Promise<void>;
  delete(id: UserId): Promise<void>;
}
