interface SecurityEvent {
  type: 'auth_failure' | 'invalid_input' | 'error' | 'security_violation';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  
  logAuthFailure(message: string, details?: Record<string, any>) {
    this.logEvent({
      type: 'auth_failure',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  logInvalidInput(message: string, details?: Record<string, any>) {
    this.logEvent({
      type: 'invalid_input',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  logError(error: Error, details?: Record<string, any>) {
    this.logEvent({
      type: 'error',
      message: error.message,
      details: {
        stack: error.stack,
        ...details
      },
      timestamp: new Date().toISOString()
    });
  }
  
  logSecurityViolation(message: string, details?: Record<string, any>) {
    this.logEvent({
      type: 'security_violation',
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  private logEvent(event: SecurityEvent) {
    this.events.push(event);
    
    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToSecurityService(event);
    }
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('[SECURITY]', event);
    }
  }
  
  private sendToSecurityService(event: SecurityEvent) {
    // This would integrate with your security monitoring service
    fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    }).catch(() => {
      // Silently fail if security logging fails
    });
  }
  
  getEvents(): SecurityEvent[] {
    return [...this.events];
  }
  
  clearEvents() {
    this.events = [];
  }
}

export const securityLogger = new SecurityLogger();