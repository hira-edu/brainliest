/**
 * Secure logging utility for production environments
 * Prevents sensitive information leakage through console statements
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data);
    }
    this.addLog('debug', message, data);
  }

  info(message: string, data?: any) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    }
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, data);
    }
    this.addLog('error', message, data);
    
    // In production, send critical errors to monitoring service
    if (!this.isDevelopment) {
      this.sendToMonitoring('error', message, data);
    }
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message: this.sanitizeMessage(message),
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data)
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private sanitizeMessage(message: string): string {
    // Remove potential sensitive information
    return message
      .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
      .replace(/token[=:]\s*[^\s]+/gi, 'token=[REDACTED]')
      .replace(/key[=:]\s*[^\s]+/gi, 'key=[REDACTED]')
      .replace(/secret[=:]\s*[^\s]+/gi, 'secret=[REDACTED]');
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return data;
  }

  private sendToMonitoring(level: LogLevel, message: string, data?: any) {
    // This would integrate with your monitoring service (e.g., Sentry, DataDog)
    try {
      fetch('/api/monitoring/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          source: 'client'
        })
      }).catch(() => {
        // Silently fail if monitoring is unavailable
      });
    } catch {
      // Silently fail if monitoring is unavailable
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new SecureLogger();