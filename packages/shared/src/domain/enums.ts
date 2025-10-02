export enum UserRole {
  STUDENT = 'STUDENT',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export enum AdminRole {
  VIEWER = 'VIEWER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export enum ExamDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

export enum QuestionType {
  SINGLE = 'SINGLE',
  MULTI = 'MULTI',
}

export enum CategoryKind {
  PROFESSIONAL = 'PROFESSIONAL',
  ACADEMIC = 'ACADEMIC',
  STANDARDIZED = 'STANDARDIZED',
}

export enum IntegrationKeyType {
  OPENAI = 'OPENAI',
  STRIPE = 'STRIPE',
  RESEND = 'RESEND',
  CAPTCHA = 'CAPTCHA',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  PUBLISH = 'PUBLISH',
  UNPUBLISH = 'UNPUBLISH',
  BLOCK_USER = 'BLOCK_USER',
  UNBLOCK_USER = 'UNBLOCK_USER',
}
