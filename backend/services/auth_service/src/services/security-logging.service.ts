import { logger } from '../utils/logger';
import { db } from '../config/database';
import { auditLogs } from '../db/schema';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface SecurityEvent {
  type: 'LOGIN_FAILED' | 'LOGIN_SUCCESS' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'TOKEN_BLACKLISTED' | 'UNAUTHORIZED_ACCESS' | 'PASSWORD_POLICY_VIOLATION' | 'ACCOUNT_CREATED' | 'ACCOUNT_DELETED' | 'PERMISSION_ESCALATION';
  userId?: string;
  email?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore?: number; // 0-100
}

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details: any;
  userId?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class SecurityLoggingService {
  private static instance: SecurityLoggingService;
  private alertThresholds: Record<string, { count: number; window: number; severity: string }> = {
    LOGIN_FAILED: { count: 5, window: 15 * 60 * 1000, severity: 'HIGH' }, // 5 failed logins in 15 minutes
    RATE_LIMIT_EXCEEDED: { count: 3, window: 5 * 60 * 1000, severity: 'MEDIUM' }, // 3 rate limit hits in 5 minutes
    SUSPICIOUS_ACTIVITY: { count: 1, window: 0, severity: 'HIGH' }, // Any suspicious activity
    PASSWORD_POLICY_VIOLATION: { count: 3, window: 60 * 60 * 1000, severity: 'MEDIUM' }, // 3 violations in 1 hour
  };

  private constructor() {}

  public static getInstance(): SecurityLoggingService {
    if (!SecurityLoggingService.instance) {
      SecurityLoggingService.instance = new SecurityLoggingService();
    }
    return SecurityLoggingService.instance;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Calculate risk score if not provided
      const riskScore = event.riskScore || await this.calculateRiskScore(event);

      // Log to database
      await db.insert(auditLogs).values({
        userId: event.userId,
        companyId: event.companyId,
        action: event.type,
        resourceType: 'security_event',
        resourceId: event.userId,
        oldValues: null,
        newValues: {
          type: event.type,
          severity: event.severity,
          riskScore,
          details: event.details,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        createdAt: new Date(),
      });

      // Log to console with appropriate level
      const logMessage = `Security Event: ${event.type}`;
      const logData = {
        type: event.type,
        severity: event.severity,
        riskScore,
        userId: event.userId,
        email: event.email,
        companyId: event.companyId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        details: event.details,
      };

      switch (event.severity) {
        case 'CRITICAL':
          logger.error(logMessage, logData);
          break;
        case 'HIGH':
          logger.warn(logMessage, logData);
          break;
        case 'MEDIUM':
          logger.warn(logMessage, logData);
          break;
        case 'LOW':
          logger.info(logMessage, logData);
          break;
      }

      // Check if this event should trigger an alert
      await this.checkForAlerts(event);

    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  /**
   * Calculate risk score for an event
   */
  private async calculateRiskScore(event: SecurityEvent): Promise<number> {
    let score = 0;

    // Base score by event type
    switch (event.type) {
      case 'LOGIN_FAILED':
        score = 30;
        break;
      case 'RATE_LIMIT_EXCEEDED':
        score = 40;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        score = 80;
        break;
      case 'PASSWORD_POLICY_VIOLATION':
        score = 20;
        break;
      case 'UNAUTHORIZED_ACCESS':
        score = 90;
        break;
      case 'TOKEN_BLACKLISTED':
        score = 50;
        break;
      case 'ACCOUNT_LOCKED':
        score = 70;
        break;
      case 'PERMISSION_ESCALATION':
        score = 95;
        break;
      default:
        score = 10;
    }

    // Adjust score based on severity
    switch (event.severity) {
      case 'CRITICAL':
        score += 20;
        break;
      case 'HIGH':
        score += 10;
        break;
      case 'MEDIUM':
        score += 5;
        break;
      case 'LOW':
        score += 0;
        break;
    }

    // Adjust score based on frequency
    if (event.ipAddress) {
      const recentEvents = await this.getRecentEventsByIP(event.ipAddress, 15 * 60 * 1000); // 15 minutes
      if (recentEvents.length > 5) {
        score += 20;
      } else if (recentEvents.length > 3) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Check if an event should trigger an alert
   */
  private async checkForAlerts(event: SecurityEvent): Promise<void> {
    try {
      const threshold = this.alertThresholds[event.type];
      if (!threshold) return;

      const now = new Date();
      const windowStart = new Date(now.getTime() - threshold.window);

      // Count recent events of this type
      const recentEvents = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.action, event.type),
            gte(auditLogs.createdAt, windowStart)
          )
        );

      if (recentEvents.length >= threshold.count) {
        await this.createSecurityAlert({
          type: event.type,
          severity: threshold.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          message: `Multiple ${event.type} events detected`,
          details: {
            eventCount: recentEvents.length,
            timeWindow: threshold.window,
            recentEvents: recentEvents.map(e => ({
              id: e.id,
              createdAt: e.createdAt,
              ipAddress: e.ipAddress,
              userAgent: e.userAgent,
            })),
          },
          userId: event.userId,
          companyId: event.companyId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        });
      }
    } catch (error) {
      logger.error('Failed to check for alerts:', error);
    }
  }

  /**
   * Create a security alert
   */
  private async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'resolved'>): Promise<void> {
    try {
      // For now, just log the alert. In a real system, you might want to:
      // - Store alerts in a separate table
      // - Send notifications to security team
      // - Integrate with SIEM systems
      // - Trigger automated responses

      logger.error('SECURITY ALERT', {
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        userId: alert.userId,
        companyId: alert.companyId,
        ipAddress: alert.ipAddress,
        userAgent: alert.userAgent,
        timestamp: new Date().toISOString(),
      });

      // TODO: Implement alert storage and notification system
    } catch (error) {
      logger.error('Failed to create security alert:', error);
    }
  }

  /**
   * Get recent security events by IP address
   */
  private async getRecentEventsByIP(ipAddress: string, timeWindow: number): Promise<any[]> {
    try {
      const windowStart = new Date(Date.now() - timeWindow);
      
      const events = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.ipAddress, ipAddress),
            gte(auditLogs.createdAt, windowStart)
          )
        )
        .orderBy(desc(auditLogs.createdAt));

      return events;
    } catch (error) {
      logger.error('Failed to get recent events by IP:', error);
      return [];
    }
  }

  /**
   * Get security events for a user
   */
  async getUserSecurityEvents(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const events = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.userId, userId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      return events;
    } catch (error) {
      logger.error('Failed to get user security events:', error);
      return [];
    }
  }

  /**
   * Get security events for a company
   */
  async getCompanySecurityEvents(companyId: string, limit: number = 100): Promise<any[]> {
    try {
      const events = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.companyId, companyId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);

      return events;
    } catch (error) {
      logger.error('Failed to get company security events:', error);
      return [];
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(timeWindow: number = 24 * 60 * 60 * 1000): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  }> {
    try {
      const windowStart = new Date(Date.now() - timeWindow);
      
      const events = await db
        .select()
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, windowStart));

      const stats = {
        totalEvents: events.length,
        eventsByType: {} as Record<string, number>,
        eventsBySeverity: {} as Record<string, number>,
        topIPs: [] as Array<{ ip: string; count: number }>,
        topUsers: [] as Array<{ userId: string; count: number }>,
      };

      // Count events by type and severity
      const ipCounts = new Map<string, number>();
      const userCounts = new Map<string, number>();

      for (const event of events) {
        // Count by type
        stats.eventsByType[event.action] = (stats.eventsByType[event.action] || 0) + 1;

        // Count by severity (from newValues)
        if (event.newValues && typeof event.newValues === 'object' && 'severity' in event.newValues) {
          const severity = (event.newValues as any).severity;
          stats.eventsBySeverity[severity] = (stats.eventsBySeverity[severity] || 0) + 1;
        }

        // Count by IP
        if (event.ipAddress) {
          ipCounts.set(event.ipAddress, (ipCounts.get(event.ipAddress) || 0) + 1);
        }

        // Count by user
        if (event.userId) {
          userCounts.set(event.userId, (userCounts.get(event.userId) || 0) + 1);
        }
      }

      // Get top IPs
      stats.topIPs = Array.from(ipCounts.entries())
        .map(([ip, count]) => ({ ip, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get top users
      stats.topUsers = Array.from(userCounts.entries())
        .map(([userId, count]) => ({ userId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return stats;
    } catch (error) {
      logger.error('Failed to get security stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        topIPs: [],
        topUsers: [],
      };
    }
  }

  /**
   * Log login failure
   */
  async logLoginFailure(email: string, ipAddress?: string, userAgent?: string, details?: any): Promise<void> {
    await this.logSecurityEvent({
      type: 'LOGIN_FAILED',
      email,
      ipAddress,
      userAgent,
      details,
      severity: 'HIGH',
    });
  }

  /**
   * Log successful login
   */
  async logLoginSuccess(userId: string, email: string, companyId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      userId,
      email,
      companyId,
      ipAddress,
      userAgent,
      severity: 'LOW',
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(ipAddress: string, endpoint: string, userAgent?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ipAddress,
      userAgent,
      details: { endpoint },
      severity: 'MEDIUM',
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(activity: string, userId?: string, companyId?: string, ipAddress?: string, userAgent?: string, details?: any): Promise<void> {
    await this.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      companyId,
      ipAddress,
      userAgent,
      details: { activity, ...details },
      severity: 'HIGH',
    });
  }

  /**
   * Log password policy violation
   */
  async logPasswordPolicyViolation(email: string, violation: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'PASSWORD_POLICY_VIOLATION',
      email,
      ipAddress,
      userAgent,
      details: { violation },
      severity: 'MEDIUM',
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(resource: string, userId?: string, companyId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.logSecurityEvent({
      type: 'UNAUTHORIZED_ACCESS',
      userId,
      companyId,
      ipAddress,
      userAgent,
      details: { resource },
      severity: 'HIGH',
    });
  }
}

// Export singleton instance
export const securityLoggingService = SecurityLoggingService.getInstance();

