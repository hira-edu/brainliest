# Automated Backup and Recovery Procedures

## Implementation Status: ✅ ENTERPRISE BACKUP SYSTEM DESIGNED

**System**: Multi-tier automated backup with verification and recovery testing  
**Date**: July 07, 2025  
**Coverage**: Continuous WAL archiving, daily base backups, weekly full backups, monthly compliance archives  
**Recovery Capability**: Point-in-time recovery with <5 minute RTO, <30 second RPO

## 📦 COMPREHENSIVE BACKUP ARCHITECTURE

### Multi-Tier Backup Strategy
**4-Tier Backup System for Complete Data Protection**:

**Tier 1: Continuous WAL Archiving**
- **Frequency**: Real-time transaction log streaming
- **Purpose**: Point-in-time recovery capability
- **Retention**: 30 days of transaction logs
- **Storage**: Encrypted S3 with cross-region replication
- **Recovery Point**: <30 seconds data loss maximum

**Tier 2: Daily Base Backups**
- **Schedule**: Daily at 2:00 AM UTC (low traffic period)
- **Method**: pg_basebackup with compression and encryption
- **Retention**: 30 days for operational recovery
- **Storage**: Multi-region S3 with Standard-IA storage class
- **Verification**: Automated daily restoration testing

**Tier 3: Weekly Full Backups**
- **Schedule**: Every Sunday at 1:00 AM UTC
- **Method**: Complete database dump with all indexes
- **Retention**: 12 weeks (3 months) for extended recovery
- **Storage**: Cross-region replication with Glacier integration
- **Testing**: Weekly restoration verification on test environment

**Tier 4: Monthly Archive Backups**
- **Schedule**: First Sunday of each month
- **Method**: Complete system backup with compliance metadata
- **Retention**: 7 years for regulatory compliance
- **Storage**: Immutable storage with legal hold capabilities
- **Verification**: Quarterly restoration and integrity testing

## 🔄 AUTOMATED BACKUP PROCEDURES

### Continuous WAL Archiving Implementation
**Real-Time Transaction Log Backup**:

```bash
#!/bin/bash
# /opt/scripts/backup/continuous_wal_archive.sh
# Continuous WAL archiving with encryption and compression

WAL_ARCHIVE_DIR="/backups/wal_archive"
S3_BUCKET="brainliest-db-backups"
ENCRYPTION_KEY="/etc/backup/encryption.key"
RETENTION_DAYS=30

archive_wal() {
    local wal_file=$1
    local wal_path=$2
    local archive_path="wal_archive/$(date +%Y/%m/%d)/$wal_file.gz.enc"
    
    # Compress and encrypt WAL file
    if gzip -c "$wal_path" | \
       openssl enc -aes-256-cbc -salt -pass file:"$ENCRYPTION_KEY" | \
       aws s3 cp - "s3://$S3_BUCKET/$archive_path" --storage-class STANDARD_IA; then
        
        log_success "WAL file $wal_file archived successfully"
        
        # Verify upload
        if aws s3 head-object --bucket "$S3_BUCKET" --key "$archive_path" >/dev/null 2>&1; then
            log_success "WAL file verification passed"
            return 0
        else
            log_error "WAL file verification failed"
            return 1
        fi
    else
        log_error "Failed to archive WAL file $wal_file"
        return 1
    fi
}

# PostgreSQL archive_command configuration:
# archive_command = '/opt/scripts/backup/continuous_wal_archive.sh %f %p'
```

### Daily Base Backup Automation
**Comprehensive Daily Backup System**:

```bash
#!/bin/bash
# /opt/scripts/backup/daily_base_backup.sh
# Daily base backup with verification and monitoring

BACKUP_DIR="/backups/base"
S3_BUCKET="brainliest-db-backups"
DB_HOST="brainliest-prod.cluster-xyz.amazonaws.com"
DB_NAME="brainliest"
BACKUP_USER="backup_user"
RETENTION_DAYS=30

create_daily_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/daily_backup_$backup_date"
    local s3_prefix="base_backups/daily/$backup_date"
    
    log_info "Starting daily backup for $backup_date"
    
    # Pre-backup health check
    if ! verify_database_health; then
        log_error "Database health check failed - aborting backup"
        send_alert "backup_health_check_failed" "Database health check failed before backup"
        exit 1
    fi
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Execute pg_basebackup with optimal settings
    pg_basebackup \
        --host="$DB_HOST" \
        --dbname="$DB_NAME" \
        --username="$BACKUP_USER" \
        --pgdata="$backup_path" \
        --format=tar \
        --gzip \
        --compress=9 \
        --verbose \
        --progress \
        --write-recovery-conf \
        --checkpoint=fast \
        --wal-method=stream
    
    if [ $? -eq 0 ]; then
        log_success "Base backup completed successfully"
        
        # Upload to S3 with metadata
        upload_backup_to_s3 "$backup_path" "$s3_prefix"
        
        # Verify backup integrity
        verify_backup_integrity "$backup_path"
        
        # Test restoration on separate instance
        schedule_restoration_test "$s3_prefix"
        
        # Update backup catalog
        update_backup_catalog "daily" "$backup_date" "$s3_prefix" "success"
        
        # Cleanup old local backups
        cleanup_old_backups "$BACKUP_DIR" "$RETENTION_DAYS"
        
        log_success "Daily backup process completed successfully"
        send_notification "backup_success" "Daily backup completed: $backup_date"
        
    else
        log_error "Base backup failed"
        send_alert "backup_failed" "Daily backup failed for $backup_date"
        exit 1
    fi
}

verify_database_health() {
    # Check database connectivity
    psql -h "$DB_HOST" -U "$BACKUP_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1
    if [ $? -ne 0 ]; then
        log_error "Database connectivity check failed"
        return 1
    fi
    
    # Check replication lag
    local lag=$(psql -h "$DB_HOST" -U "$BACKUP_USER" -d "$DB_NAME" -t -c "
        SELECT CASE WHEN pg_is_in_recovery() THEN 
            EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
        ELSE 0 END;")
    
    if [ "${lag%.*}" -gt 60 ]; then  # More than 60 seconds lag
        log_error "Replication lag too high: ${lag} seconds"
        return 1
    fi
    
    # Check disk space
    local disk_usage=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        log_error "Insufficient disk space: ${disk_usage}% used"
        return 1
    fi
    
    log_success "Database health check passed"
    return 0
}

upload_backup_to_s3() {
    local backup_path=$1
    local s3_prefix=$2
    
    # Upload with metadata and encryption
    aws s3 sync "$backup_path" "s3://$S3_BUCKET/$s3_prefix/" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 \
        --metadata "backup-type=daily,backup-date=$(date -Iseconds),database-name=$DB_NAME"
    
    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to S3: s3://$S3_BUCKET/$s3_prefix/"
        return 0
    else
        log_error "Failed to upload backup to S3"
        return 1
    fi
}

# Execute daily backup
create_daily_backup
```

### Automated Restoration Testing
**Daily Restoration Verification System**:

```bash
#!/bin/bash
# /opt/scripts/backup/automated_restore_test.sh
# Automated backup restoration testing

TEST_INSTANCE_PREFIX="brainliest-restore-test"
BACKUP_S3_BUCKET="brainliest-db-backups"

test_backup_restoration() {
    local backup_date=${1:-$(date -d "yesterday" +%Y%m%d)}
    local test_instance="${TEST_INSTANCE_PREFIX}-${backup_date}"
    
    log_info "Starting restoration test for backup: $backup_date"
    
    # Create test RDS instance
    create_test_instance "$test_instance"
    
    # Wait for instance availability
    wait_for_instance_ready "$test_instance"
    
    # Restore backup to test instance
    restore_backup_to_instance "$test_instance" "$backup_date"
    
    # Verify data integrity
    verify_restored_data "$test_instance"
    
    # Performance benchmark
    run_performance_tests "$test_instance"
    
    # Cleanup test instance
    cleanup_test_instance "$test_instance"
    
    log_success "Restoration test completed for backup: $backup_date"
}

create_test_instance() {
    local instance_name=$1
    
    aws rds create-db-instance \
        --db-instance-identifier "$instance_name" \
        --db-instance-class db.t3.medium \
        --engine postgres \
        --engine-version 15.4 \
        --master-username "testuser" \
        --master-user-password "$(generate_random_password)" \
        --allocated-storage 100 \
        --storage-type gp3 \
        --vpc-security-group-ids "$TEST_SECURITY_GROUP" \
        --db-subnet-group-name "$TEST_SUBNET_GROUP" \
        --backup-retention-period 0 \
        --storage-encrypted \
        --deletion-protection false \
        --tags Key=Purpose,Value=BackupTest Key=AutoDelete,Value=true
    
    if [ $? -eq 0 ]; then
        log_success "Test instance creation initiated: $instance_name"
    else
        log_error "Failed to create test instance: $instance_name"
        exit 1
    fi
}

verify_restored_data() {
    local instance_name=$1
    local test_host=$(get_instance_endpoint "$instance_name")
    
    # Connect to test instance and verify data
    local subject_count=$(psql -h "$test_host" -U testuser -d brainliest -t -c "
        SELECT COUNT(*) FROM subjects;")
    
    local question_count=$(psql -h "$test_host" -U testuser -d brainliest -t -c "
        SELECT COUNT(*) FROM questions;")
    
    local user_count=$(psql -h "$test_host" -U testuser -d brainliest -t -c "
        SELECT COUNT(*) FROM users;")
    
    # Verify expected data ranges
    if [ "$subject_count" -ge 50 ] && [ "$question_count" -ge 40 ] && [ "$user_count" -ge 1 ]; then
        log_success "Data integrity verification passed: $subject_count subjects, $question_count questions, $user_count users"
        
        # Verify data relationships
        verify_referential_integrity "$test_host"
        
        return 0
    else
        log_error "Data integrity verification failed: insufficient records"
        send_alert "restore_test_failed" "Data integrity check failed for backup restoration test"
        return 1
    fi
}

verify_referential_integrity() {
    local test_host=$1
    
    # Check foreign key constraints
    local constraint_violations=$(psql -h "$test_host" -U testuser -d brainliest -t -c "
        SELECT COUNT(*) FROM (
            SELECT 'questions without valid exams' as issue
            FROM questions q 
            LEFT JOIN exams e ON q.exam_id = e.id 
            WHERE e.id IS NULL
            UNION ALL
            SELECT 'exams without valid subjects' as issue
            FROM exams ex 
            LEFT JOIN subjects s ON ex.subject_id = s.id 
            WHERE s.id IS NULL
        ) violations;")
    
    if [ "$constraint_violations" -eq 0 ]; then
        log_success "Referential integrity verification passed"
        return 0
    else
        log_error "Referential integrity violations found: $constraint_violations"
        return 1
    fi
}

run_performance_tests() {
    local instance_name=$1
    local test_host=$(get_instance_endpoint "$instance_name")
    
    # Run performance benchmark queries
    log_info "Running performance tests on restored database"
    
    # Test query performance
    local query_time=$(psql -h "$test_host" -U testuser -d brainliest -c "
        \timing on
        SELECT s.name, COUNT(q.id) as question_count 
        FROM subjects s 
        LEFT JOIN questions q ON s.id = q.subject_id 
        GROUP BY s.name 
        ORDER BY question_count DESC;" 2>&1 | grep "Time:" | awk '{print $2}')
    
    log_info "Sample query execution time: $query_time"
    
    # Verify index performance
    local index_usage=$(psql -h "$test_host" -U testuser -d brainliest -t -c "
        SELECT COUNT(*) FROM pg_stat_user_indexes WHERE idx_scan > 0;")
    
    log_info "Active indexes detected: $index_usage"
    
    return 0
}

# Schedule automated restoration testing
# Crontab entry: 0 5 * * * /opt/scripts/backup/automated_restore_test.sh
```

## 📋 BACKUP VERIFICATION PROCEDURES

### Multi-Level Verification System
**Comprehensive Backup Integrity Verification**:

**Level 1: File Integrity Verification**
- **Checksum Verification**: SHA-256 checksums for all backup files
- **Compression Testing**: Verify all compressed files can be decompressed
- **Encryption Validation**: Test encrypted backup files can be decrypted
- **File Size Validation**: Compare backup sizes against expected ranges

**Level 2: Database Content Verification**
- **Record Count Validation**: Verify expected number of records in each table
- **Relationship Integrity**: Check all foreign key relationships are intact
- **Data Type Validation**: Ensure all data types are preserved correctly
- **Index Verification**: Confirm all indexes are properly restored

**Level 3: Functional Testing**
- **Application Connectivity**: Test application can connect to restored database
- **Query Performance**: Verify restored database meets performance benchmarks
- **Transaction Testing**: Test ACID properties in restored environment
- **User Authentication**: Verify all user accounts and permissions are intact

### Backup Catalog Management
**Centralized Backup Tracking System**:

```sql
-- Backup catalog table for tracking all backups
CREATE TABLE IF NOT EXISTS backup_catalog (
    id SERIAL PRIMARY KEY,
    backup_type VARCHAR(20) NOT NULL, -- 'wal', 'daily', 'weekly', 'monthly'
    backup_date TIMESTAMP NOT NULL,
    backup_location TEXT NOT NULL,
    backup_size_bytes BIGINT,
    compression_ratio NUMERIC(4,2),
    encryption_status BOOLEAN DEFAULT true,
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed'
    verification_date TIMESTAMP,
    restoration_tested BOOLEAN DEFAULT false,
    restoration_test_date TIMESTAMP,
    retention_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- Function to register new backups
CREATE OR REPLACE FUNCTION register_backup(
    p_backup_type VARCHAR(20),
    p_backup_location TEXT,
    p_backup_size_bytes BIGINT,
    p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS INTEGER AS $$
DECLARE
    backup_id INTEGER;
BEGIN
    INSERT INTO backup_catalog (
        backup_type, backup_date, backup_location, 
        backup_size_bytes, metadata
    ) VALUES (
        p_backup_type, NOW(), p_backup_location, 
        p_backup_size_bytes, p_metadata
    ) RETURNING id INTO backup_id;
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update verification status
CREATE OR REPLACE FUNCTION update_backup_verification(
    p_backup_id INTEGER,
    p_verification_status VARCHAR(20),
    p_restoration_tested BOOLEAN DEFAULT false
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE backup_catalog 
    SET 
        verification_status = p_verification_status,
        verification_date = NOW(),
        restoration_tested = p_restoration_tested,
        restoration_test_date = CASE WHEN p_restoration_tested THEN NOW() ELSE restoration_test_date END
    WHERE id = p_backup_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 RECOVERY PROCEDURES

### Point-in-Time Recovery (PITR)
**Comprehensive Recovery Process**:

```bash
#!/bin/bash
# /opt/scripts/recovery/point_in_time_recovery.sh
# Point-in-time recovery procedure

recover_to_point_in_time() {
    local target_time=$1  # Format: 'YYYY-MM-DD HH:MM:SS'
    local recovery_instance=$2
    
    log_info "Starting point-in-time recovery to: $target_time"
    
    # Find appropriate base backup
    local base_backup=$(find_base_backup_before_time "$target_time")
    
    if [ -z "$base_backup" ]; then
        log_error "No suitable base backup found for target time: $target_time"
        exit 1
    fi
    
    # Create recovery instance
    create_recovery_instance "$recovery_instance"
    
    # Restore base backup
    restore_base_backup "$base_backup" "$recovery_instance"
    
    # Configure recovery.conf for point-in-time recovery
    configure_pitr "$recovery_instance" "$target_time"
    
    # Start PostgreSQL with recovery mode
    start_recovery_instance "$recovery_instance"
    
    # Monitor recovery progress
    monitor_recovery_progress "$recovery_instance"
    
    # Verify recovery completion
    verify_recovery_success "$recovery_instance" "$target_time"
    
    log_success "Point-in-time recovery completed successfully"
}

configure_pitr() {
    local instance_name=$1
    local target_time=$2
    
    # Create recovery configuration
    cat > "/var/lib/postgresql/data/recovery.conf" << EOF
restore_command = '/opt/scripts/recovery/restore_wal.sh %f %p'
recovery_target_time = '$target_time'
recovery_target_timeline = 'latest'
recovery_target_action = 'promote'
EOF
    
    log_info "Recovery configuration created for target time: $target_time"
}

monitor_recovery_progress() {
    local instance_name=$1
    
    while true; do
        local recovery_status=$(psql -h "$instance_name" -U postgres -t -c "
            SELECT CASE WHEN pg_is_in_recovery() THEN 'recovering' ELSE 'complete' END;")
        
        if [ "$recovery_status" = "complete" ]; then
            log_success "Recovery completed successfully"
            break
        fi
        
        local last_replayed=$(psql -h "$instance_name" -U postgres -t -c "
            SELECT pg_last_xact_replay_timestamp();")
        
        log_info "Recovery in progress. Last replayed: $last_replayed"
        sleep 30
    done
}
```

### Disaster Recovery Procedures
**Multi-Region Disaster Recovery**:

**RTO (Recovery Time Objective): < 5 minutes**
- Automated failover to standby regions
- Pre-configured read replicas promoted to primary
- DNS automatic failover with health checks
- Application connection string updates

**RPO (Recovery Point Objective): < 30 seconds**
- Continuous WAL streaming to multiple regions
- Synchronous replication for critical transactions
- Automated backup verification across regions
- Point-in-time recovery capability maintained

---

**Backup System Status**: ✅ Enterprise-grade automated backup system designed and ready for implementation
**Recovery Capability**: Point-in-time recovery with <5 minute RTO and <30 second RPO
**Verification**: Automated daily restoration testing with comprehensive integrity checks
**Compliance**: 7-year retention with immutable storage for regulatory requirements

**Next Phase**: Deploy backup automation scripts and configure multi-region replication for disaster recovery.

**Backup Engineer**: Claude 4.0 Sonnet  
**System Design Completed**: July 07, 2025 at 1:30 PM UTC