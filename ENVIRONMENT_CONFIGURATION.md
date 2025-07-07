# Environment-Specific Database Configuration

## Implementation Status: ✅ MULTI-ENVIRONMENT SETUP COMPLETE

**Framework**: Environment separation with configuration management and deployment safety  
**Date**: July 07, 2025  
**Environments**: Development, Staging, Production with isolated configurations  
**Impact**: Secure deployment pipeline with environment-specific controls

## 🌍 ENVIRONMENT SEPARATION STRATEGY

### Development Environment Configuration
**Local Development Setup**:

```bash
# .env.development
# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/brainliest_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=brainliest_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_SSL_MODE=disable

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=5000

# Development Features
MIGRATION_AUTO_APPLY=true
DEBUG_QUERIES=true
QUERY_LOGGING=verbose
BACKUP_ENABLED=false
PERFORMANCE_MONITORING=basic

# Security Settings (Relaxed for Development)
JWT_SECRET=dev_jwt_secret_key_not_for_production
SESSION_SECRET=dev_session_secret
ENCRYPTION_KEY=dev_encryption_key
CORS_ORIGIN=http://localhost:3000,http://localhost:5000

# External Services (Development)
EMAIL_SERVICE_PROVIDER=console
RECAPTCHA_ENABLED=false
AI_SERVICE_PROVIDER=mock
```

### Staging Environment Configuration
**Pre-Production Testing Environment**:

```bash
# .env.staging
# Database Configuration (Read Replica for Testing)
DATABASE_URL=postgresql://staging_user:${STAGING_DB_PASSWORD}@brainliest-staging.cluster-xyz.amazonaws.com:5432/brainliest_staging
DB_HOST=brainliest-staging.cluster-xyz.amazonaws.com
DB_PORT=5432
DB_NAME=brainliest_staging
DB_USER=staging_user
DB_PASSWORD=${STAGING_DB_PASSWORD}
DB_SSL_MODE=require

# Connection Pool Settings
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_POOL_IDLE_TIMEOUT=60000
DB_CONNECTION_TIMEOUT=10000

# Migration Controls
MIGRATION_AUTO_APPLY=false
MIGRATION_REQUIRE_BACKUP=true
DEBUG_QUERIES=false
QUERY_LOGGING=errors_only
BACKUP_ENABLED=true
BACKUP_VERIFICATION=true

# Security Settings (Production-Like)
JWT_SECRET=${STAGING_JWT_SECRET}
SESSION_SECRET=${STAGING_SESSION_SECRET}
ENCRYPTION_KEY=${STAGING_ENCRYPTION_KEY}
CORS_ORIGIN=https://staging.brainliest.com

# External Services (Staging)
EMAIL_SERVICE_PROVIDER=sendgrid_staging
RECAPTCHA_ENABLED=true
AI_SERVICE_PROVIDER=gemini_staging
MONITORING_ENABLED=true
```

### Production Environment Configuration
**Live Production Environment**:

```bash
# .env.production
# Database Configuration (Multi-AZ with Read Replicas)
DATABASE_URL=postgresql://prod_user:${PROD_DB_PASSWORD}@brainliest-prod.cluster-xyz.amazonaws.com:5432/brainliest_prod
DB_HOST=brainliest-prod.cluster-xyz.amazonaws.com
DB_READ_REPLICA_HOSTS=brainliest-prod-replica-1.cluster-xyz.amazonaws.com,brainliest-prod-replica-2.cluster-xyz.amazonaws.com
DB_PORT=5432
DB_NAME=brainliest_prod
DB_USER=prod_user
DB_PASSWORD=${PROD_DB_PASSWORD}
DB_SSL_MODE=require
DB_SSL_CERT=/etc/ssl/certs/rds-ca-2019-root.pem

# Connection Pool Settings (High Performance)
DB_POOL_MIN=10
DB_POOL_MAX=100
DB_POOL_IDLE_TIMEOUT=300000
DB_CONNECTION_TIMEOUT=15000
DB_STATEMENT_TIMEOUT=30000
DB_LOCK_TIMEOUT=10000

# Migration Controls (Maximum Safety)
MIGRATION_AUTO_APPLY=false
MIGRATION_REQUIRE_APPROVAL=true
MIGRATION_REQUIRE_BACKUP=true
MIGRATION_MAINTENANCE_WINDOW=true
DEBUG_QUERIES=false
QUERY_LOGGING=slow_queries_only
SLOW_QUERY_THRESHOLD=1000

# Backup and Recovery
BACKUP_ENABLED=true
BACKUP_VERIFICATION=true
BACKUP_ENCRYPTION=true
BACKUP_RETENTION_DAYS=30
POINT_IN_TIME_RECOVERY=true
CROSS_REGION_BACKUP=true

# Security Settings (Maximum Security)
JWT_SECRET=${PROD_JWT_SECRET}
SESSION_SECRET=${PROD_SESSION_SECRET}
ENCRYPTION_KEY=${PROD_ENCRYPTION_KEY}
CORS_ORIGIN=https://brainliest.com,https://www.brainliest.com
RATE_LIMITING=strict
SECURITY_HEADERS=strict

# External Services (Production)
EMAIL_SERVICE_PROVIDER=resend_production
RECAPTCHA_ENABLED=true
AI_SERVICE_PROVIDER=gemini_production
MONITORING_ENABLED=true
ALERTING_ENABLED=true
AUDIT_LOGGING=comprehensive

# Compliance
DATA_RETENTION_ENFORCEMENT=true
GDPR_COMPLIANCE=true
AUDIT_TRAIL_REQUIRED=true
ACCESS_LOGGING=comprehensive
```

## 🔒 ENVIRONMENT-SPECIFIC SAFETY CONTROLS

### Production Deployment Safeguards
**Multi-Layer Protection System**:

```sql
-- Environment detection and safety controls
CREATE OR REPLACE FUNCTION get_current_environment() 
RETURNS TEXT AS $$
DECLARE
    env_name TEXT;
    db_name TEXT;
BEGIN
    -- Get database name to determine environment
    SELECT current_database() INTO db_name;
    
    -- Map database names to environments
    CASE 
        WHEN db_name LIKE '%_dev' OR db_name LIKE '%development%' THEN
            env_name := 'development';
        WHEN db_name LIKE '%_staging' OR db_name LIKE '%staging%' THEN
            env_name := 'staging';
        WHEN db_name LIKE '%_prod' OR db_name LIKE '%production%' THEN
            env_name := 'production';
        ELSE
            env_name := 'unknown';
    END CASE;
    
    RETURN env_name;
END;
$$ LANGUAGE plpgsql;

-- Production migration safety checks
CREATE OR REPLACE FUNCTION enforce_production_safety() 
RETURNS BOOLEAN AS $$
DECLARE
    current_env TEXT;
    is_maintenance_window BOOLEAN;
    has_recent_backup BOOLEAN;
    has_approval BOOLEAN;
BEGIN
    SELECT get_current_environment() INTO current_env;
    
    -- Only enforce for production
    IF current_env != 'production' THEN
        RETURN TRUE;
    END IF;
    
    -- Check maintenance window (Sunday 2-4 AM UTC)
    SELECT (
        EXTRACT(DOW FROM NOW() AT TIME ZONE 'UTC') = 0 AND
        EXTRACT(HOUR FROM NOW() AT TIME ZONE 'UTC') BETWEEN 2 AND 4
    ) INTO is_maintenance_window;
    
    -- Check for recent backup (within last 24 hours)
    SELECT EXISTS (
        SELECT 1 FROM backup_catalog 
        WHERE backup_type = 'daily' 
        AND verification_status = 'passed'
        AND backup_date > NOW() - INTERVAL '24 hours'
    ) INTO has_recent_backup;
    
    -- Check for migration approval (within last 2 hours)
    SELECT EXISTS (
        SELECT 1 FROM migration_approvals 
        WHERE environment = 'production'
        AND approved_at > NOW() - INTERVAL '2 hours'
        AND is_active = true
    ) INTO has_approval;
    
    -- Enforce all safety requirements
    IF NOT is_maintenance_window THEN
        RAISE EXCEPTION 'Production changes only allowed during maintenance window (Sunday 2-4 AM UTC)';
    END IF;
    
    IF NOT has_recent_backup THEN
        RAISE EXCEPTION 'Recent verified backup required for production changes';
    END IF;
    
    IF NOT has_approval THEN
        RAISE EXCEPTION 'Migration approval required for production changes';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### Environment Configuration Validation
**Automated Configuration Verification**:

```typescript
// server/config/environment-validator.ts
interface EnvironmentConfig {
  environment: 'development' | 'staging' | 'production';
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    sslMode: 'disable' | 'require' | 'verify-full';
    poolSettings: {
      min: number;
      max: number;
      idleTimeout: number;
      connectionTimeout: number;
    };
  };
  migration: {
    autoApply: boolean;
    requireApproval: boolean;
    requireBackup: boolean;
    maintenanceWindow: boolean;
  };
  security: {
    jwtSecret: string;
    sessionSecret: string;
    encryptionKey: string;
    corsOrigins: string[];
    rateLimiting: 'disabled' | 'basic' | 'strict';
  };
  monitoring: {
    queryLogging: 'disabled' | 'errors_only' | 'slow_queries_only' | 'verbose';
    performanceMonitoring: 'disabled' | 'basic' | 'comprehensive';
    auditLogging: 'disabled' | 'basic' | 'comprehensive';
  };
}

class EnvironmentValidator {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): EnvironmentConfig {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      environment: env as any,
      database: {
        url: process.env.DATABASE_URL || '',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'brainliest_dev',
        user: process.env.DB_USER || 'postgres',
        sslMode: (process.env.DB_SSL_MODE as any) || 'disable',
        poolSettings: {
          min: parseInt(process.env.DB_POOL_MIN || '2'),
          max: parseInt(process.env.DB_POOL_MAX || '10'),
          idleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
          connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
        },
      },
      migration: {
        autoApply: process.env.MIGRATION_AUTO_APPLY === 'true',
        requireApproval: process.env.MIGRATION_REQUIRE_APPROVAL === 'true',
        requireBackup: process.env.MIGRATION_REQUIRE_BACKUP === 'true',
        maintenanceWindow: process.env.MIGRATION_MAINTENANCE_WINDOW === 'true',
      },
      security: {
        jwtSecret: process.env.JWT_SECRET || '',
        sessionSecret: process.env.SESSION_SECRET || '',
        encryptionKey: process.env.ENCRYPTION_KEY || '',
        corsOrigins: (process.env.CORS_ORIGIN || '').split(','),
        rateLimiting: (process.env.RATE_LIMITING as any) || 'basic',
      },
      monitoring: {
        queryLogging: (process.env.QUERY_LOGGING as any) || 'errors_only',
        performanceMonitoring: (process.env.PERFORMANCE_MONITORING as any) || 'basic',
        auditLogging: (process.env.AUDIT_LOGGING as any) || 'basic',
      },
    };
  }

  private validateConfiguration(): void {
    const { environment } = this.config;

    // Environment-specific validation
    switch (environment) {
      case 'development':
        this.validateDevelopmentConfig();
        break;
      case 'staging':
        this.validateStagingConfig();
        break;
      case 'production':
        this.validateProductionConfig();
        break;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }

    console.log(`✅ Environment configuration validated for: ${environment}`);
  }

  private validateDevelopmentConfig(): void {
    // Development can be more lenient
    if (!this.config.database.url) {
      throw new Error('DATABASE_URL is required for development');
    }
  }

  private validateStagingConfig(): void {
    // Staging should be production-like
    if (!this.config.database.url.includes('staging')) {
      console.warn('⚠️ Database URL does not contain "staging" - verify environment');
    }

    if (this.config.migration.autoApply) {
      throw new Error('Auto-migration is not allowed in staging environment');
    }

    if (!this.config.migration.requireBackup) {
      throw new Error('Backup requirement must be enabled in staging');
    }
  }

  private validateProductionConfig(): void {
    // Production requires maximum security
    const requiredSecrets = ['jwtSecret', 'sessionSecret', 'encryptionKey'];
    
    for (const secret of requiredSecrets) {
      if (!this.config.security[secret as keyof typeof this.config.security]) {
        throw new Error(`${secret} is required for production environment`);
      }
    }

    if (this.config.migration.autoApply) {
      throw new Error('Auto-migration is strictly forbidden in production');
    }

    if (!this.config.migration.requireApproval) {
      throw new Error('Migration approval is required in production');
    }

    if (!this.config.migration.requireBackup) {
      throw new Error('Backup requirement is mandatory in production');
    }

    if (this.config.database.sslMode === 'disable') {
      throw new Error('SSL is required for production database connections');
    }

    if (this.config.monitoring.auditLogging !== 'comprehensive') {
      throw new Error('Comprehensive audit logging is required in production');
    }
  }

  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  isStaging(): boolean {
    return this.config.environment === 'staging';
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }
}

export const environmentValidator = new EnvironmentValidator();
export const envConfig = environmentValidator.getConfig();
```

## 📋 DATABASE MIGRATION APPROVALS

### Migration Approval Workflow
**Production Change Management**:

```sql
-- Migration approval tracking table
CREATE TABLE IF NOT EXISTS migration_approvals (
    id SERIAL PRIMARY KEY,
    migration_version VARCHAR(20) NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    environment VARCHAR(20) NOT NULL,
    request_reason TEXT NOT NULL,
    approval_reason TEXT,
    requested_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    risk_assessment TEXT,
    rollback_plan TEXT,
    metadata JSONB
);

-- Function to request migration approval
CREATE OR REPLACE FUNCTION request_migration_approval(
    p_migration_version VARCHAR(20),
    p_environment VARCHAR(20),
    p_reason TEXT,
    p_risk_assessment TEXT DEFAULT NULL,
    p_rollback_plan TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    approval_id INTEGER;
    expiry_time TIMESTAMP;
BEGIN
    -- Set expiry time based on environment
    IF p_environment = 'production' THEN
        expiry_time := NOW() + INTERVAL '2 hours';
    ELSE
        expiry_time := NOW() + INTERVAL '24 hours';
    END IF;
    
    INSERT INTO migration_approvals (
        migration_version, requested_by, environment, 
        request_reason, expires_at, risk_assessment, rollback_plan
    ) VALUES (
        p_migration_version, current_user, p_environment,
        p_reason, expiry_time, p_risk_assessment, p_rollback_plan
    ) RETURNING id INTO approval_id;
    
    -- Log approval request
    INSERT INTO system_events (event_type, event_category, message, event_data)
    VALUES ('migration_approval_request', 'database_management',
            'Migration approval requested for ' || p_environment,
            jsonb_build_object(
                'migration_version', p_migration_version,
                'environment', p_environment,
                'approval_id', approval_id
            ));
    
    RETURN approval_id;
END;
$$ LANGUAGE plpgsql;

-- Function to approve migration
CREATE OR REPLACE FUNCTION approve_migration(
    p_approval_id INTEGER,
    p_approval_reason TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    approval_record RECORD;
BEGIN
    -- Get approval record
    SELECT * INTO approval_record 
    FROM migration_approvals 
    WHERE id = p_approval_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Migration approval request not found';
    END IF;
    
    IF approval_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Migration approval request has expired';
    END IF;
    
    -- Update approval
    UPDATE migration_approvals 
    SET 
        approved_by = current_user,
        approved_at = NOW(),
        approval_reason = p_approval_reason
    WHERE id = p_approval_id;
    
    -- Log approval
    INSERT INTO system_events (event_type, event_category, message, event_data)
    VALUES ('migration_approved', 'database_management',
            'Migration approved for ' || approval_record.environment,
            jsonb_build_object(
                'migration_version', approval_record.migration_version,
                'environment', approval_record.environment,
                'approved_by', current_user
            ));
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

**Environment Configuration Status**: ✅ Multi-environment setup with comprehensive safety controls  
**Coverage**: Development, staging, production with environment-specific configurations  
**Security**: Production deployment safeguards with approval workflows and maintenance windows  
**Compliance**: Automated validation and audit logging for all environment changes

**Configuration Engineer**: Claude 4.0 Sonnet  
**System Deployed**: July 07, 2025 at 1:30 PM UTC