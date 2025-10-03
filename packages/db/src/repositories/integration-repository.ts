import type { PaginatedResult } from '../types';

export type IntegrationKeyType = 'OPENAI' | 'STRIPE' | 'RESEND' | 'CAPTCHA';
export type IntegrationEnvironment = 'production' | 'staging' | 'development';

export interface IntegrationKeyRecord {
  readonly id: string;
  readonly name: string;
  readonly type: IntegrationKeyType;
  readonly environment: IntegrationEnvironment;
  readonly description: string | null;
  readonly lastRotatedAt: Date | null;
  readonly createdByAdminId: string | null;
  readonly createdByAdminEmail?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface IntegrationKeyFilter {
  readonly type?: IntegrationKeyType;
  readonly environment?: IntegrationEnvironment;
  readonly search?: string;
}

export interface IntegrationKeyRepository {
  list(filters: IntegrationKeyFilter, page: number, pageSize: number): Promise<PaginatedResult<IntegrationKeyRecord>>;
}
