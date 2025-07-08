# Cloud-Ready Database Deployment Configuration

## Multi-Cloud Production Deployment Guide

### AWS RDS PostgreSQL Configuration

#### Primary Database (US-East-1)
```yaml
# terraform/aws/rds-primary.tf
resource "aws_db_instance" "brainliest_primary" {
  identifier = "brainliest-prod-primary"
  
  # Instance Configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.r6g.xlarge"
  
  # Storage Configuration
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  # Multi-AZ Configuration
  multi_az               = true
  availability_zone      = "us-east-1a"
  backup_retention_period = 30
  backup_window          = "02:00-03:00"
  maintenance_window     = "sun:03:00-sun:04:00"
  
  # Security Configuration
  vpc_security_group_ids = [aws_security_group.db_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  # Performance Configuration
  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_enhanced_monitoring.arn
  
  # Database Configuration
  db_name  = "brainliest"
  username = "dbadmin"
  password = random_password.db_password.result
  
  # Deletion Protection
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "brainliest-final-snapshot"
  
  tags = {
    Environment = "production"
    Application = "brainliest"
    Backup      = "critical"
  }
}
```

#### Read Replicas Configuration
```yaml
# US-West Read Replica
resource "aws_db_instance" "brainliest_replica_west" {
  identifier = "brainliest-prod-replica-west"
  
  # Replica Configuration
  replicate_source_db = aws_db_instance.brainliest_primary.identifier
  instance_class      = "db.r6g.large"
  
  # Geographic Configuration
  availability_zone = "us-west-2a"
  
  # Performance Configuration
  performance_insights_enabled = true
  monitoring_interval         = 60
  
  tags = {
    Environment = "production"
    Application = "brainliest"
    Role        = "read-replica"
    Region      = "us-west"
  }
}

# EU-West Read Replica
resource "aws_db_instance" "brainliest_replica_eu" {
  identifier = "brainliest-prod-replica-eu"
  provider   = aws.eu-west-1
  
  # Cross-Region Replica
  replicate_source_db = aws_db_instance.brainliest_primary.arn
  instance_class      = "db.r6g.large"
  
  # GDPR Compliance Configuration
  storage_encrypted = true
  kms_key_id       = aws_kms_key.eu_encryption.arn
  
  tags = {
    Environment = "production"
    Application = "brainliest"
    Role        = "read-replica"
    Region      = "eu-west"
    Compliance  = "gdpr"
  }
}
```

### Google Cloud SQL Configuration

#### Primary Instance
```yaml
# terraform/gcp/cloudsql-primary.tf
resource "google_sql_database_instance" "brainliest_primary" {
  name             = "brainliest-prod-primary"
  database_version = "POSTGRES_15"
  region          = "us-central1"
  
  settings {
    tier = "db-custom-4-16384"
    
    # High Availability
    availability_type = "REGIONAL"
    
    # Backup Configuration
    backup_configuration {
      enabled                        = true
      start_time                    = "02:00"
      location                      = "us"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }
    
    # Maintenance Window
    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }
    
    # Database Flags
    database_flags {
      name  = "shared_preload_libraries"
      value = "pg_stat_statements"
    }
    
    database_flags {
      name  = "log_statement"
      value = "ddl"
    }
    
    # IP Configuration
    ip_configuration {
      ipv4_enabled       = false
      private_network    = google_compute_network.vpc.id
      require_ssl        = true
      allocated_ip_range = google_compute_global_address.private_ip_address.name
    }
    
    # Insights Configuration
    insights_config {
      query_insights_enabled  = true
      record_application_tags = true
      record_client_address  = true
    }
  }
  
  # Deletion Protection
  deletion_protection = true
}
```

### Azure Database for PostgreSQL Configuration

#### Flexible Server Configuration
```yaml
# terraform/azure/postgres-flexible.tf
resource "azurerm_postgresql_flexible_server" "brainliest_primary" {
  name                   = "brainliest-prod-primary"
  resource_group_name    = azurerm_resource_group.main.name
  location              = azurerm_resource_group.main.location
  version               = "15"
  
  # Server Configuration
  sku_name   = "GP_Standard_D4s_v3"
  storage_mb = 131072
  
  # High Availability
  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }
  
  # Backup Configuration
  backup_retention_days        = 30
  geo_redundant_backup_enabled = true
  
  # Maintenance Window
  maintenance_window {
    day_of_week  = 0
    start_hour   = 3
    start_minute = 0
  }
  
  # Security Configuration
  authentication {
    active_directory_auth_enabled = true
    password_auth_enabled         = true
    tenant_id                    = data.azurerm_client_config.current.tenant_id
  }
  
  tags = {
    Environment = "production"
    Application = "brainliest"
  }
}

# Read Replica Configuration
resource "azurerm_postgresql_flexible_server" "brainliest_replica" {
  name                = "brainliest-prod-replica-eu"
  resource_group_name = azurerm_resource_group.eu.name
  location           = "West Europe"
  
  # Replica Configuration
  create_mode               = "Replica"
  source_server_id         = azurerm_postgresql_flexible_server.brainliest_primary.id
  replication_role         = "AsyncReplica"
  
  tags = {
    Environment = "production"
    Application = "brainliest"
    Role        = "replica"
  }
}
```

## Automated Backup and Recovery Configuration

### Comprehensive Backup Strategy

#### Continuous WAL Archiving
```bash
#!/bin/bash
# scripts/backup/continuous_wal_archive.sh

# WAL Archive Configuration
WAL_ARCHIVE_DIR="/backups/wal_archive"
S3_BUCKET="brainliest-db-backups"
RETENTION_DAYS=30

# Archive WAL files to S3
archive_wal() {
    local wal_file=$1
    local wal_path=$2
    
    # Compress and encrypt WAL file
    gzip -c "$wal_path" | \
    openssl enc -aes-256-cbc -salt -pass file:/etc/backup/encryption.key | \
    aws s3 cp - "s3://$S3_BUCKET/wal_archive/$(date +%Y/%m/%d)/$wal_file.gz.enc"
    
    if [ $? -eq 0 ]; then
        echo "$(date): Successfully archived $wal_file" >> /var/log/postgresql/wal_archive.log
        return 0
    else
        echo "$(date): Failed to archive $wal_file" >> /var/log/postgresql/wal_archive.log
        return 1
    fi
}

# PostgreSQL Configuration for WAL Archiving
# postgresql.conf additions:
# wal_level = replica
# archive_mode = on
# archive_command = '/opt/scripts/backup/continuous_wal_archive.sh %f %p'
# max_wal_senders = 10
# wal_keep_size = 1GB
```

#### Daily Base Backup Script
```bash
#!/bin/bash
# scripts/backup/daily_base_backup.sh

BACKUP_DIR="/backups/base"
S3_BUCKET="brainliest-db-backups"
RETENTION_DAYS=30
DB_HOST="brainliest-prod-primary.cluster-xyz.us-east-1.rds.amazonaws.com"
DB_NAME="brainliest"

# Create base backup
create_base_backup() {
    local backup_date=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/base_backup_$backup_date"
    
    echo "$(date): Starting base backup for $backup_date"
    
    # Create backup using pg_basebackup
    pg_basebackup \
        -h "$DB_HOST" \
        -D "$backup_path" \
        -U backup_user \
        -v \
        -P \
        -W \
        -Ft \
        -z \
        -Z 9
    
    if [ $? -eq 0 ]; then
        # Upload to S3
        aws s3 sync "$backup_path" "s3://$S3_BUCKET/base_backups/$backup_date/" \
            --storage-class STANDARD_IA
        
        # Verify backup integrity
        verify_backup "$backup_path"
        
        echo "$(date): Base backup completed successfully"
    else
        echo "$(date): Base backup failed"
        exit 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_path=$1
    
    # Check backup files exist and are readable
    if [ -f "$backup_path/base.tar.gz" ]; then
        # Test decompression
        gunzip -t "$backup_path/base.tar.gz"
        if [ $? -eq 0 ]; then
            echo "$(date): Backup verification successful"
            return 0
        fi
    fi
    
    echo "$(date): Backup verification failed"
    return 1
}

# Execute backup
create_base_backup
```

#### Automated Restoration Testing
```bash
#!/bin/bash
# scripts/backup/restore_verification.sh

TEST_INSTANCE="brainliest-restore-test"
BACKUP_DATE=${1:-$(date -d "yesterday" +%Y%m%d)}

# Automated restoration test
test_restoration() {
    local backup_date=$1
    
    echo "$(date): Starting restoration test for backup $backup_date"
    
    # Create test instance
    aws rds create-db-instance \
        --db-instance-identifier "$TEST_INSTANCE" \
        --db-instance-class db.t3.micro \
        --engine postgres \
        --master-username testuser \
        --master-user-password $(openssl rand -base64 12) \
        --allocated-storage 20
    
    # Wait for instance to be available
    aws rds wait db-instance-available \
        --db-instance-identifier "$TEST_INSTANCE"
    
    # Restore from backup
    restore_from_backup "$backup_date"
    
    # Verify data integrity
    verify_data_integrity
    
    # Cleanup test instance
    aws rds delete-db-instance \
        --db-instance-identifier "$TEST_INSTANCE" \
        --skip-final-snapshot
    
    echo "$(date): Restoration test completed"
}

# Verify restored data integrity
verify_data_integrity() {
    local test_host=$(aws rds describe-db-instances \
        --db-instance-identifier "$TEST_INSTANCE" \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    
    # Run integrity checks
    psql -h "$test_host" -U testuser -d brainliest -c "
        SELECT 
            COUNT(*) as subject_count,
            (SELECT COUNT(*) FROM exams) as exam_count,
            (SELECT COUNT(*) FROM questions) as question_count;
    "
    
    # Verify critical data exists
    local subject_count=$(psql -h "$test_host" -U testuser -d brainliest -t -c "SELECT COUNT(*) FROM subjects;")
    
    if [ "$subject_count" -gt 0 ]; then
        echo "$(date): Data integrity verification passed"
        return 0
    else
        echo "$(date): Data integrity verification failed"
        return 1
    fi
}

# Schedule daily restoration test
# Add to crontab: 0 4 * * * /opt/scripts/backup/restore_verification.sh
```

## Monitoring and Alerting Implementation

### Comprehensive Monitoring Stack

#### Database Health Monitoring
```sql
-- Create monitoring views for real-time health tracking
CREATE OR REPLACE VIEW database_health_dashboard AS
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value,
  CASE 
    WHEN pg_database_size(current_database()) > 10737418240 THEN 'warning'  -- 10GB
    WHEN pg_database_size(current_database()) > 21474836480 THEN 'critical' -- 20GB
    ELSE 'healthy'
  END as status
UNION ALL
SELECT 
  'Active Connections' as metric,
  count(*)::text as value,
  CASE 
    WHEN count(*) > 80 THEN 'critical'
    WHEN count(*) > 60 THEN 'warning'
    ELSE 'healthy'
  END as status
FROM pg_stat_activity 
WHERE state = 'active'
UNION ALL
SELECT 
  'Cache Hit Ratio' as metric,
  round((sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100)::numeric, 2)::text || '%' as value,
  CASE 
    WHEN round((sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100)::numeric, 2) < 90 THEN 'warning'
    WHEN round((sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100)::numeric, 2) < 80 THEN 'critical'
    ELSE 'healthy'
  END as status
FROM pg_statio_user_tables;
```

#### Performance Monitoring Dashboard
```python
# monitoring/performance_monitor.py
import psycopg2
import time
import json
import boto3
from datetime import datetime

class DatabaseMonitor:
    def __init__(self, connection_string):
        self.conn = psycopg2.connect(connection_string)
        self.cloudwatch = boto3.client('cloudwatch')
    
    def check_slow_queries(self, threshold_ms=1000):
        """Monitor slow queries and send alerts"""
        query = """
        SELECT 
            query_hash,
            query_text,
            avg_execution_time,
            total_calls,
            total_time
        FROM monitor_slow_queries(%s);
        """
        
        with self.conn.cursor() as cur:
            cur.execute(query, (threshold_ms/1000,))
            slow_queries = cur.fetchall()
        
        if slow_queries:
            self.send_alert('slow_queries', {
                'count': len(slow_queries),
                'queries': slow_queries[:5],  # Top 5 slowest
                'threshold_ms': threshold_ms
            })
        
        return slow_queries
    
    def check_replication_lag(self, max_lag_seconds=30):
        """Monitor replication lag across all replicas"""
        query = "SELECT * FROM check_replication_health();"
        
        with self.conn.cursor() as cur:
            cur.execute(query)
            replicas = cur.fetchall()
        
        for replica in replicas:
            lag_seconds = replica[1]  # replication_lag_seconds
            
            if lag_seconds > max_lag_seconds:
                self.send_alert('replication_lag', {
                    'replica_name': replica[0],
                    'lag_seconds': lag_seconds,
                    'max_allowed': max_lag_seconds
                })
        
        return replicas
    
    def check_database_health(self):
        """Comprehensive health check"""
        query = "SELECT * FROM monitor_database_health();"
        
        with self.conn.cursor() as cur:
            cur.execute(query)
            metrics = cur.fetchall()
        
        critical_issues = []
        warnings = []
        
        for metric in metrics:
            metric_name, value, unit, status, warn_threshold, crit_threshold = metric
            
            if status == 'critical':
                critical_issues.append({
                    'metric': metric_name,
                    'value': float(value),
                    'threshold': float(crit_threshold)
                })
            elif status == 'warning':
                warnings.append({
                    'metric': metric_name,
                    'value': float(value),
                    'threshold': float(warn_threshold)
                })
            
            # Send metrics to CloudWatch
            self.cloudwatch.put_metric_data(
                Namespace='Brainliest/Database',
                MetricData=[
                    {
                        'MetricName': metric_name,
                        'Value': float(value),
                        'Unit': 'Count' if unit == 'count' else 'Percent',
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
        
        if critical_issues:
            self.send_alert('critical_health_issues', critical_issues)
        
        if warnings:
            self.send_alert('health_warnings', warnings)
        
        return metrics
    
    def send_alert(self, alert_type, data):
        """Send alerts to multiple channels"""
        alert_payload = {
            'timestamp': datetime.utcnow().isoformat(),
            'alert_type': alert_type,
            'data': data,
            'severity': 'critical' if 'critical' in alert_type else 'warning'
        }
        
        # Send to SNS for immediate notification
        sns = boto3.client('sns')
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:account:database-alerts',
            Message=json.dumps(alert_payload),
            Subject=f'Database Alert: {alert_type}'
        )
        
        # Log to CloudWatch Logs
        logs = boto3.client('logs')
        logs.put_log_events(
            logGroupName='/aws/rds/brainliest/alerts',
            logStreamName=datetime.utcnow().strftime('%Y/%m/%d'),
            logEvents=[
                {
                    'timestamp': int(time.time() * 1000),
                    'message': json.dumps(alert_payload)
                }
            ]
        )

# Monitoring scheduler
if __name__ == "__main__":
    monitor = DatabaseMonitor("postgresql://user:pass@host:5432/brainliest")
    
    # Run comprehensive monitoring every 5 minutes
    while True:
        try:
            monitor.check_slow_queries()
            monitor.check_replication_lag()
            monitor.check_database_health()
        except Exception as e:
            print(f"Monitoring error: {e}")
        
        time.sleep(300)  # 5 minutes
```

### Auto-Scaling Configuration

#### Application-Level Connection Management
```typescript
// Enhanced database connection management with auto-scaling
// server/db-connection-manager.ts
import { Pool, PoolConfig } from 'pg';
import { performance } from 'perf_hooks';

interface ConnectionPoolConfig {
  primary: PoolConfig;
  replicas: PoolConfig[];
  readWriteRatio: number;
}

class DatabaseConnectionManager {
  private primaryPool: Pool;
  private replicaPools: Pool[];
  private readWriteRatio: number;
  private connectionMetrics: Map<string, number> = new Map();

  constructor(config: ConnectionPoolConfig) {
    this.primaryPool = new Pool({
      ...config.primary,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.replicaPools = config.replicas.map(replicaConfig => 
      new Pool({
        ...replicaConfig,
        max: 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    );

    this.readWriteRatio = config.readWriteRatio;
    this.setupHealthChecks();
  }

  async query(text: string, params?: any[], options: { readOnly?: boolean } = {}) {
    const startTime = performance.now();
    
    try {
      const pool = this.selectPool(options.readOnly);
      const result = await pool.query(text, params);
      
      this.recordMetrics('query_success', performance.now() - startTime);
      return result;
    } catch (error) {
      this.recordMetrics('query_error', performance.now() - startTime);
      
      // Retry on replica if primary fails for read queries
      if (options.readOnly && this.replicaPools.length > 0) {
        const replicaPool = this.replicaPools[Math.floor(Math.random() * this.replicaPools.length)];
        return await replicaPool.query(text, params);
      }
      
      throw error;
    }
  }

  private selectPool(readOnly: boolean = false): Pool {
    if (!readOnly) {
      return this.primaryPool;
    }

    // Route read queries to replicas based on load balancing
    if (this.replicaPools.length > 0 && Math.random() < this.readWriteRatio) {
      const healthyReplicas = this.replicaPools.filter(pool => 
        this.connectionMetrics.get(`replica_${pool}`) !== undefined
      );
      
      if (healthyReplicas.length > 0) {
        return healthyReplicas[Math.floor(Math.random() * healthyReplicas.length)];
      }
    }

    return this.primaryPool;
  }

  private setupHealthChecks() {
    setInterval(async () => {
      // Check primary connection
      try {
        await this.primaryPool.query('SELECT 1');
        this.connectionMetrics.set('primary_health', Date.now());
      } catch (error) {
        console.error('Primary database health check failed:', error);
      }

      // Check replica connections
      for (let i = 0; i < this.replicaPools.length; i++) {
        try {
          await this.replicaPools[i].query('SELECT 1');
          this.connectionMetrics.set(`replica_${i}_health`, Date.now());
        } catch (error) {
          console.error(`Replica ${i} health check failed:`, error);
          this.connectionMetrics.delete(`replica_${i}_health`);
        }
      }
    }, 30000); // Health check every 30 seconds
  }

  private recordMetrics(type: string, duration: number) {
    this.connectionMetrics.set(`${type}_${Date.now()}`, duration);
    
    // Clean up old metrics (keep last 100)
    const entries = Array.from(this.connectionMetrics.entries());
    if (entries.length > 100) {
      const sorted = entries.sort((a, b) => b[1] - a[1]);
      this.connectionMetrics.clear();
      sorted.slice(0, 100).forEach(([key, value]) => {
        this.connectionMetrics.set(key, value);
      });
    }
  }

  getHealthMetrics() {
    return {
      primaryConnections: this.primaryPool.totalCount,
      replicaConnections: this.replicaPools.map(pool => pool.totalCount),
      idleConnections: this.primaryPool.idleCount,
      waitingCount: this.primaryPool.waitingCount,
      metrics: Array.from(this.connectionMetrics.entries())
    };
  }
}

export const dbManager = new DatabaseConnectionManager({
  primary: {
    host: process.env.DB_PRIMARY_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  replicas: [
    {
      host: process.env.DB_REPLICA_WEST_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    },
    {
      host: process.env.DB_REPLICA_EU_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  ],
  readWriteRatio: 0.8 // 80% of reads go to replicas
});
```

This comprehensive scalability architecture provides enterprise-grade database scalability with multi-region deployment, automated backups, cloud-ready configurations, and comprehensive monitoring systems ready for production deployment supporting millions of users globally.