// Security service imports removed as they're not used
import { logger } from '../utils/logger';
import { AuditService } from './audit.service';
import { cacheService } from './cache.service';
import * as crypto from 'node:crypto';

export interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  companyId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
}

export interface LoginAttempt {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  reason?: string;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSymbols: boolean;
  sessionTimeout: number; // minutes
  requireMFA: boolean;
  allowedIPs: string[];
  blockedIPs: string[];
}

export interface DeviceInfo {
  id: string;
  userId: string;
  name: string;
  type: string;
  os: string;
  browser: string;
  ipAddress: string;
  lastSeen: Date;
  isTrusted: boolean;
  isActive: boolean;
}

export class SecurityService {
  private readonly defaultSettings: SecuritySettings = {
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    sessionTimeout: 480, // 8 hours
    requireMFA: false,
    allowedIPs: [],
    blockedIPs: [],
  };

  // Track Login Attempts
  async trackLoginAttempt(attempt: LoginAttempt): Promise<void> {
    try {
      const key = `login_attempts:${attempt.email}:${attempt.ipAddress}`;
      const attempts = await cacheService.get<LoginAttempt[]>(key) || [];
      
      attempts.push(attempt);
      
      // Keep only last 10 attempts
      if (attempts.length > 10) {
        attempts.splice(0, attempts.length - 10);
      }
      
      await cacheService.set(key, attempts, 3600); // 1 hour TTL
      
      // Log security event
      await new AuditService().logSecurityEvent({
        event: 'login_attempt',
        userId: attempt.email,
        severity: attempt.success ? 'low' : 'medium',
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        details: {
          email: attempt.email,
          success: attempt.success,
          reason: attempt.reason,
        },
      });
      
      // Check for suspicious activity
      await this.checkSuspiciousActivity(attempt);
    } catch (error) {
      logger.error('Failed to track login attempt:', error);
    }
  }

  // Check Suspicious Activity
  private async checkSuspiciousActivity(attempt: LoginAttempt): Promise<void> {
    try {
      const key = `login_attempts:${attempt.email}:${attempt.ipAddress}`;
      const attempts = await cacheService.get<LoginAttempt[]>(key) || [];
      
      // Check for brute force
      const recentFailedAttempts = attempts.filter(
        a => !a.success && 
        (Date.now() - a.timestamp.getTime()) < 15 * 60 * 1000 // Last 15 minutes
      );
      
      if (recentFailedAttempts.length >= 5) {
        await this.handleBruteForceAttack(attempt.email, attempt.ipAddress);
      }
      
      // Check for multiple IPs
      const uniqueIPs = new Set(attempts.map(a => a.ipAddress));
      if (uniqueIPs.size > 3) {
        await this.handleMultipleIPAccess(attempt.email, Array.from(uniqueIPs));
      }
    } catch (error) {
      logger.error('Failed to check suspicious activity:', error);
    }
  }

  // Handle Brute Force Attack
  private async handleBruteForceAttack(email: string, ipAddress: string): Promise<void> {
    try {
      // Block IP temporarily
      await cacheService.set(`blocked_ip:${ipAddress}`, true, 30 * 60); // 30 minutes
      
      // Log critical security event
      await new AuditService().logSecurityEvent({
        event: 'brute_force_attack',
        severity: 'critical',
        ipAddress,
        details: {
          email,
          ipAddress,
          blocked: true,
          duration: '30 minutes',
        },
      });
      
      logger.warn(`Brute force attack detected from IP ${ipAddress} for email ${email}`);
    } catch (error) {
      logger.error('Failed to handle brute force attack:', error);
    }
  }

  // Handle Multiple IP Access
  private async handleMultipleIPAccess(email: string, ipAddresses: string[]): Promise<void> {
    try {
      await new AuditService().logSecurityEvent({
        event: 'multiple_ip_access',
        severity: 'high',
        details: {
          email,
          ipAddresses,
          count: ipAddresses.length,
        },
      });
      
      logger.warn(`Multiple IP access detected for email ${email}: ${ipAddresses.join(', ')}`);
    } catch (error) {
      logger.error('Failed to handle multiple IP access:', error);
    }
  }

  // Check IP Blocking
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    try {
      return await cacheService.exists(`blocked_ip:${ipAddress}`);
    } catch (error) {
      logger.error('Failed to check IP blocking:', error);
      return false;
    }
  }

  // Validate Password Strength
  async validatePasswordStrength(password: string): Promise<{
    isValid: boolean;
    score: number;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      symbols: boolean;
    };
  }> {
    const settings = await this.getSecuritySettings();
    
    const requirements = {
      length: password.length >= settings.passwordMinLength,
      uppercase: settings.passwordRequireUppercase ? Boolean(/[A-Z]/.test(password)) : true,
      lowercase: settings.passwordRequireLowercase ? Boolean(/[a-z]/.test(password)) : true,
      numbers: settings.passwordRequireNumbers ? Boolean(/\d/.test(password)) : true,
      symbols: settings.passwordRequireSymbols ? Boolean(/[!@#$%^&*(),.?":{}|<>]/.test(password)) : true,
    };
    
    const isValid = Object.values(requirements).every(req => req);
    const score = Object.values(requirements).filter(req => req).length;
    
    return { isValid, score, requirements };
  }

  // Generate Secure Token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate API Key
  generateAPIKey(): string {
    const prefix = 'germy_';
    const key = crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, '');
    return `${prefix}${key}`;
  }

  // Hash Sensitive Data
  hashSensitiveData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Encrypt Data
  encryptData(data: string, key: string): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), Buffer.alloc(16));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Decrypt Data
  decryptData(encryptedData: string, key: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), Buffer.alloc(16));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Get Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const settings = await cacheService.get<SecuritySettings>('security_settings');
      return settings || this.defaultSettings;
    } catch (error) {
      logger.error('Failed to get security settings:', error);
      return this.defaultSettings;
    }
  }

  // Update Security Settings
  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<void> {
    try {
      const currentSettings = await this.getSecuritySettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await cacheService.set('security_settings', updatedSettings, 0); // No expiration
      
      logger.info('Security settings updated');
    } catch (error) {
      logger.error('Failed to update security settings:', error);
    }
  }

  // Register Device
  async registerDevice(deviceInfo: Omit<DeviceInfo, 'id' | 'lastSeen' | 'isActive'>): Promise<string> {
    try {
      const deviceId = crypto.randomUUID();
      const device: DeviceInfo = {
        ...deviceInfo,
        id: deviceId,
        lastSeen: new Date(),
        isActive: true,
      };
      
      await cacheService.set(`device:${deviceId}`, device, 0);
      await cacheService.sadd(`user_devices:${deviceInfo.userId}`, deviceId);
      
      await new AuditService().logSecurityEvent({
        event: 'device_registered',
        userId: deviceInfo.userId,
        severity: 'low',
        ipAddress: deviceInfo.ipAddress,
        details: {
          deviceId,
          name: deviceInfo.name,
          type: deviceInfo.type,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
        },
      });
      
      logger.info(`Device registered: ${deviceId} for user ${deviceInfo.userId}`);
      return deviceId;
    } catch (error) {
      logger.error('Failed to register device:', error);
      throw error;
    }
  }

  // Get User Devices
  async getUserDevices(userId: string): Promise<DeviceInfo[]> {
    try {
      const deviceIds = await cacheService.smembers<string>(`user_devices:${userId}`);
      const devices: DeviceInfo[] = [];
      
      for (const deviceId of deviceIds) {
        const device = await cacheService.get<DeviceInfo>(`device:${deviceId}`);
        if (device) {
          devices.push(device);
        }
      }
      
      return devices.sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
    } catch (error) {
      logger.error('Failed to get user devices:', error);
      return [];
    }
  }

  // Revoke Device
  async revokeDevice(deviceId: string, userId: string): Promise<boolean> {
    try {
      const device = await cacheService.get<DeviceInfo>(`device:${deviceId}`);
      if (!device || device.userId !== userId) {
        return false;
      }
      
      await cacheService.delete(`device:${deviceId}`);
      await cacheService.srem(`user_devices:${userId}`, deviceId);
      
      await new AuditService().logSecurityEvent({
        event: 'device_revoked',
        userId,
        severity: 'medium',
        details: {
          deviceId,
          name: device.name,
          type: device.type,
        },
      });
      
      logger.info(`Device revoked: ${deviceId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to revoke device:', error);
      return false;
    }
  }

  // Check Session Validity
  async isSessionValid(sessionId: string, userId: string): Promise<boolean> {
    try {
      const session = await cacheService.get<any>(`session:${sessionId}`);
      if (!session || session.userId !== userId) {
        return false;
      }
      
      const settings = await this.getSecuritySettings();
      const sessionAge = Date.now() - session.createdAt;
      const maxAge = settings.sessionTimeout * 60 * 1000; // Convert to milliseconds
      
      if (sessionAge > maxAge) {
        await cacheService.delete(`session:${sessionId}`);
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to check session validity:', error);
      return false;
    }
  }

  // Create Session
  async createSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    try {
      const sessionId = this.generateSecureToken();
      const session = {
        id: sessionId,
        userId,
        ipAddress,
        userAgent,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      
      const settings = await this.getSecuritySettings();
      const ttl = settings.sessionTimeout * 60; // Convert to seconds
      
      await cacheService.set(`session:${sessionId}`, session, ttl);
      
      await new AuditService().logSecurityEvent({
        event: 'session_created',
        userId,
        severity: 'low',
        ipAddress,
        userAgent,
        details: { sessionId },
      });
      
      logger.info(`Session created: ${sessionId} for user ${userId}`);
      return sessionId;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  // Destroy Session
  async destroySession(sessionId: string, userId: string): Promise<void> {
    try {
      await cacheService.delete(`session:${sessionId}`);
      
      await new AuditService().logSecurityEvent({
        event: 'session_destroyed',
        userId,
        severity: 'low',
        details: { sessionId },
      });
      
      logger.info(`Session destroyed: ${sessionId} for user ${userId}`);
    } catch (error) {
      logger.error('Failed to destroy session:', error);
    }
  }

  // Get Security Events
  async getSecurityEvents(filters: {
    userId?: string;
    companyId?: string;
    severity?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  }) {
    try {
      return await new AuditService().getSecurityEvents(filters);
    } catch (error) {
      logger.error('Failed to get security events:', error);
      return {
        success: false,
        message: 'Failed to retrieve security events',
      };
    }
  }

  // Generate Security Report
  async generateSecurityReport(companyId: string, dateRange: { from: Date; to: Date }) {
    try {
      const events = await new AuditService().getSecurityEvents({
        companyId,
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        limit: 1000,
      });
      
      if (!events.success) {
        return events;
      }
      
      const report = {
        companyId,
        dateRange,
        totalEvents: events.data?.securityEvents?.length || 0,
        severityBreakdown: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        } as Record<string, number>,
        topEvents: {} as Record<string, number>,
        recommendations: [] as string[],
      };
      
      // Analyze events
      if (events.data?.securityEvents) {
        for (const event of events.data.securityEvents) {
          const severity = (event.newValues as any)?.severity || 'low';
          report.severityBreakdown[severity]++;
          
          const eventType = event.action.replace('security_', '');
          report.topEvents[eventType] = (report.topEvents[eventType] || 0) + 1;
        }
      }
      
      // Generate recommendations
      if (report.severityBreakdown.critical > 0) {
        report.recommendations.push('Immediate attention required for critical security events');
      }
      
      if (report.topEvents.brute_force_attack > 0) {
        report.recommendations.push('Consider implementing IP blocking and rate limiting');
      }
      
      if (report.topEvents.multiple_ip_access > 0) {
        report.recommendations.push('Review user access patterns and consider device management');
      }
      
      return {
        success: true,
        data: report,
      };
    } catch (error) {
      logger.error('Failed to generate security report:', error);
      return {
        success: false,
        message: 'Failed to generate security report',
      };
    }
  }
}

// Singleton instance
export const securityService = new SecurityService();
