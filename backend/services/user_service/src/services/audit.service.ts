import { eq, and, desc, count, gte, lte, like } from 'drizzle-orm';
import { db } from '../config/database';
import { userActivities, users } from '../db/schema';
import { logger } from '../utils/logger';

export interface AuditEvent {
  userId: string;
  companyId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

export interface AuditFilters {
  userId?: string;
  companyId?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface SecurityEvent {
  event: string;
  userId?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemEvent {
  event: string;
  service: string;
  details: any;
  level: 'info' | 'warn' | 'error' | 'critical';
}

export class AuditService {
  // User Action Logging
  async logUserAction(event: AuditEvent): Promise<void> {
    try {
      await db.insert(userActivities).values({
        userId: event.userId,
        companyId: event.companyId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        oldValues: event.oldValues,
        newValues: event.newValues,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      });

      logger.info(`User action logged: ${event.action} by user ${event.userId}`, {
        userId: event.userId,
        companyId: event.companyId,
        action: event.action,
        resourceType: event.resourceType,
      });
    } catch (error) {
      logger.error('Failed to log user action:', error);
    }
  }

  // System Event Logging
  async logSystemEvent(event: SystemEvent): Promise<void> {
    try {
      // Log to application logs
      const logLevel = event.level === 'critical' ? 'error' : event.level;
      logger[logLevel](`System event: ${event.event}`, {
        service: event.service,
        event: event.event,
        details: event.details,
        level: event.level,
        timestamp: new Date().toISOString(),
      });

      // Store in database for audit trail
      await db.insert(userActivities).values({
        userId: 'system', // Special system user ID
        companyId: 'system', // Special system company ID
        action: `system_${event.event}`,
        resourceType: 'system',
        resourceId: event.service,
        newValues: {
          event: event.event,
          service: event.service,
          details: event.details,
          level: event.level,
        },
        ipAddress: 'system',
        userAgent: 'system',
      });
    } catch (error) {
      logger.error('Failed to log system event:', error);
    }
  }

  // Security Event Logging
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log security event with appropriate level
      let logLevel: 'info' | 'warn' | 'error';
      if (event.severity === 'critical') {
        logLevel = 'error';
      } else if (event.severity === 'high') {
        logLevel = 'warn';
      } else {
        logLevel = 'info';
      }
      
      logger[logLevel](`Security event: ${event.event}`, {
        severity: event.severity,
        event: event.event,
        userId: event.userId,
        companyId: event.companyId,
        ipAddress: event.ipAddress,
        details: event.details,
        timestamp: new Date().toISOString(),
      });

      // Store in database
      await db.insert(userActivities).values({
        userId: event.userId || 'anonymous',
        companyId: event.companyId || 'unknown',
        action: `security_${event.event}`,
        resourceType: 'security',
        newValues: {
          event: event.event,
          severity: event.severity,
          details: event.details,
        },
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      });
    } catch (error) {
      logger.error('Failed to log security event:', error);
    }
  }

  // Data Change Logging
  async logDataChange(
    table: string,
    recordId: string,
    oldData: any,
    newData: any,
    userId: string,
    companyId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await db.insert(userActivities).values({
        userId,
        companyId,
        action: 'data_changed',
        resourceType: table,
        resourceId: recordId,
        oldValues: oldData,
        newValues: newData,
        ipAddress,
        userAgent,
      });

      logger.info(`Data change logged: ${table} record ${recordId}`, {
        table,
        recordId,
        userId,
        companyId,
        changes: Object.keys(newData || {}),
      });
    } catch (error) {
      logger.error('Failed to log data change:', error);
    }
  }

  // Get Audit Trail
  async getAuditTrail(filters: AuditFilters) {
    try {
      const {
        userId,
        companyId,
        action,
        resourceType,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = filters;

      const offset = (page - 1) * limit;
      const conditions = [];

      if (userId) {
        conditions.push(eq(userActivities.userId, userId));
      }

      if (companyId) {
        conditions.push(eq(userActivities.companyId, companyId));
      }

      if (action) {
        conditions.push(like(userActivities.action, `%${action}%`));
      }

      if (resourceType) {
        conditions.push(eq(userActivities.resourceType, resourceType));
      }

      if (dateFrom) {
        conditions.push(gte(userActivities.createdAt, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(userActivities.createdAt, dateTo));
      }

      const activities = await db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          companyId: userActivities.companyId,
          action: userActivities.action,
          resourceType: userActivities.resourceType,
          resourceId: userActivities.resourceId,
          oldValues: userActivities.oldValues,
          newValues: userActivities.newValues,
          ipAddress: userActivities.ipAddress,
          userAgent: userActivities.userAgent,
          createdAt: userActivities.createdAt,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(userActivities)
        .leftJoin(users, eq(userActivities.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(userActivities)
        .where(and(...conditions));

      return {
        success: true,
        data: {
          activities,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get audit trail error:', error);
      return {
        success: false,
        message: 'Failed to retrieve audit trail',
      };
    }
  }

  // Export Audit Log
  async exportAuditLog(format: string, dateRange: { from: Date; to: Date }, filters?: Partial<AuditFilters>) {
    try {
      const conditions = [
        gte(userActivities.createdAt, dateRange.from),
        lte(userActivities.createdAt, dateRange.to),
      ];

      if (filters?.userId) {
        conditions.push(eq(userActivities.userId, filters.userId));
      }

      if (filters?.companyId) {
        conditions.push(eq(userActivities.companyId, filters.companyId));
      }

      if (filters?.action) {
        conditions.push(like(userActivities.action, `%${filters.action}%`));
      }

      const activities = await db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          companyId: userActivities.companyId,
          action: userActivities.action,
          resourceType: userActivities.resourceType,
          resourceId: userActivities.resourceId,
          oldValues: userActivities.oldValues,
          newValues: userActivities.newValues,
          ipAddress: userActivities.ipAddress,
          userAgent: userActivities.userAgent,
          createdAt: userActivities.createdAt,
          user: {
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(userActivities)
        .leftJoin(users, eq(userActivities.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(userActivities.createdAt));

      if (format === 'csv') {
        const csvData = [
          'ID,User ID,Company ID,Action,Resource Type,Resource ID,IP Address,User Agent,Created At,User Name,User Email',
          ...activities.map(a => 
            `${a.id},${a.userId},${a.companyId},${a.action},${a.resourceType},${a.resourceId || ''},${a.ipAddress || ''},${a.userAgent || ''},${a.createdAt},${a.user ? a.user.firstName + ' ' + a.user.lastName : ''},${a.user?.email || ''}`
          ).join('\n')
        ].join('\n');

        return {
          success: true,
          data: {
            format: 'csv',
            content: csvData,
            filename: `audit-log-${dateRange.from.toISOString().split('T')[0]}-to-${dateRange.to.toISOString().split('T')[0]}.csv`,
          },
        };
      } else {
        return {
          success: true,
          data: {
            format: 'json',
            activities,
            exportedAt: new Date(),
            totalCount: activities.length,
            dateRange,
          },
        };
      }
    } catch (error) {
      logger.error('Export audit log error:', error);
      return {
        success: false,
        message: 'Failed to export audit log',
      };
    }
  }

  // Get Security Events
  async getSecurityEvents(filters: AuditFilters) {
    try {
      const {
        userId,
        companyId,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50,
      } = filters;

      const offset = (page - 1) * limit;
      const conditions = [like(userActivities.action, 'security_%')];

      if (userId) {
        conditions.push(eq(userActivities.userId, userId));
      }

      if (companyId) {
        conditions.push(eq(userActivities.companyId, companyId));
      }

      if (dateFrom) {
        conditions.push(gte(userActivities.createdAt, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(userActivities.createdAt, dateTo));
      }

      const securityEvents = await db
        .select({
          id: userActivities.id,
          userId: userActivities.userId,
          companyId: userActivities.companyId,
          action: userActivities.action,
          resourceType: userActivities.resourceType,
          newValues: userActivities.newValues,
          ipAddress: userActivities.ipAddress,
          userAgent: userActivities.userAgent,
          createdAt: userActivities.createdAt,
        })
        .from(userActivities)
        .where(and(...conditions))
        .orderBy(desc(userActivities.createdAt))
        .limit(limit)
        .offset(offset);

      const totalCount = await db
        .select({ count: count() })
        .from(userActivities)
        .where(and(...conditions));

      return {
        success: true,
        data: {
          securityEvents,
          pagination: {
            page,
            limit,
            total: totalCount[0].count,
            pages: Math.ceil(totalCount[0].count / limit),
          },
        },
      };
    } catch (error) {
      logger.error('Get security events error:', error);
      return {
        success: false,
        message: 'Failed to retrieve security events',
      };
    }
  }

  // Cleanup Old Audit Logs
  async cleanupOldLogs(olderThanDays: number = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db
        .delete(userActivities)
        .where(lte(userActivities.createdAt, cutoffDate));

      logger.info(`Cleaned up audit logs older than ${olderThanDays} days`);

      return {
        success: true,
        message: `Cleaned up audit logs older than ${olderThanDays} days`,
        deletedCount: result.length || 0,
      };
    } catch (error) {
      logger.error('Cleanup old audit logs error:', error);
      return {
        success: false,
        message: 'Failed to cleanup old audit logs',
      };
    }
  }
}
