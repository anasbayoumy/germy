import { db } from '../config/database';
import { attendanceRecords } from '../db/schema/attendance';
import { logger } from '../utils/logger';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';

export interface AttendanceRecord {
  id: string;
  userId: string;
  companyId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  workMode: 'onsite' | 'remote' | 'hybrid';
  faceSimilarityScore?: string | null;
  faceSimilarityScoreClockOut?: string | null;
  livenessScore?: string | null;
  livenessScoreClockOut?: string | null;
  activityScore?: string | null;
  productivityScore?: string | null;
  overallRiskScore?: string | null;
  aiProcessingTime?: number;
  verificationMetadata?: any;
  verificationMetadataClockOut?: any;
  fraudDetectionResults?: any;
  deviceFingerprint?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
  productiveTime?: number;
  breakTime?: number;
  distractionTime?: number;
  workApplications?: any;
  activityProof?: any;
  photoUrl?: string | null;
  clockOutPhotoUrl?: string | null;
  location?: any;
  status: 'active' | 'completed' | 'flagged' | 'approved' | 'rejected' | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendanceData {
  userId: string;
  companyId: string;
  clockInTime: Date;
  workMode: 'onsite' | 'remote' | 'hybrid';
  location?: any;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
  photoUrl?: string;
  faceSimilarity?: number;
  livenessScore?: number;
  activityScore?: number;
  productivityScore?: number;
  overallRiskScore?: number;
  aiProcessingTime?: number;
  verificationMetadata?: any;
}

export interface UpdateAttendanceData {
  clockOutTime?: Date;
  clockOutPhotoUrl?: string;
  faceSimilarityClockOut?: number;
  livenessScoreClockOut?: number;
  verificationMetadataClockOut?: any;
  overallRiskScore?: number;
  fraudDetectionResults?: any;
}

export interface AttendanceResult {
  success: boolean;
  message?: string;
  data?: AttendanceRecord;
  error?: string;
}

export interface AttendanceListResult {
  success: boolean;
  message?: string;
  data?: {
    records: AttendanceRecord[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export class AttendanceService {
  /**
   * Create a new attendance record
   */
  async createAttendanceRecord(data: CreateAttendanceData): Promise<AttendanceResult> {
    try {
      logger.info('Creating attendance record', {
        service: 'attendance-service',
        userId: data.userId,
        companyId: data.companyId,
        workMode: data.workMode
      });

      const [record] = await db.insert(attendanceRecords).values({
        id: crypto.randomUUID(),
        userId: data.userId,
        companyId: data.companyId,
        clockInTime: data.clockInTime,
        workMode: data.workMode,
        location: data.location,
        deviceInfo: data.deviceInfo || null,
        userAgent: data.userAgent || null,
        deviceFingerprint: data.ipAddress || null,
        photoUrl: data.photoUrl || null,
        faceSimilarityScore: data.faceSimilarity?.toString() || null,
        livenessScore: data.livenessScore?.toString() || null,
        activityScore: data.activityScore?.toString() || null,
        productivityScore: data.productivityScore?.toString() || null,
        overallRiskScore: data.overallRiskScore?.toString() || '0',
        aiProcessingTime: data.aiProcessingTime || 0,
        verificationMetadata: data.verificationMetadata,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const createdRecord = record;
      
      if (!createdRecord) {
        return {
          success: false,
          message: 'Failed to create attendance record',
          error: 'DATABASE_ERROR'
        };
      }
      
      logger.info('Attendance record created successfully', {
        service: 'attendance-service',
        attendanceId: createdRecord.id,
        userId: data.userId
      });

      return {
        success: true,
        message: 'Attendance record created successfully',
        data: createdRecord as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to create attendance record:', error);
      return {
        success: false,
        message: 'Failed to create attendance record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get attendance record by ID
   */
  async getAttendanceRecord(attendanceId: string): Promise<AttendanceResult> {
    try {
      const [record] = await db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.id, attendanceId))
        .limit(1);

      if (!record) {
        return {
          success: false,
          message: 'Attendance record not found',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        data: record as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to get attendance record:', error);
      return {
        success: false,
        message: 'Failed to get attendance record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update attendance record with clock-out data
   */
  async updateAttendanceClockOut(attendanceId: string, data: UpdateAttendanceData): Promise<AttendanceResult> {
    try {
      logger.info('Updating attendance record with clock-out', {
        service: 'attendance-service',
        attendanceId
      });

      const clockOutTime = data.clockOutTime || new Date();
      
      const [record] = await db
        .update(attendanceRecords)
        .set({
          clockOutTime,
          clockOutPhotoUrl: data.clockOutPhotoUrl || null,
          faceSimilarityScoreClockOut: data.faceSimilarityClockOut?.toString() || null,
          livenessScoreClockOut: data.livenessScoreClockOut?.toString() || null,
          verificationMetadataClockOut: data.verificationMetadataClockOut,
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, attendanceId))
        .returning();

      if (!record) {
        return {
          success: false,
          message: 'Attendance record not found',
          error: 'NOT_FOUND'
        };
      }

      // Calculate work duration
      const workDuration = record.clockOutTime && record.clockInTime 
        ? record.clockOutTime.getTime() - record.clockInTime.getTime()
        : 0;

      logger.info('Attendance record updated with clock-out', {
        service: 'attendance-service',
        attendanceId,
        workDuration: workDuration / (1000 * 60 * 60) // Convert to hours
      });

      return {
        success: true,
        message: 'Attendance record updated successfully',
        data: record as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to update attendance record:', error);
      return {
        success: false,
        message: 'Failed to update attendance record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update attendance record with fraud analysis results
   */
  async updateAttendanceFraudAnalysis(attendanceId: string, data: UpdateAttendanceData): Promise<AttendanceResult> {
    try {
      logger.info('Updating attendance record with fraud analysis', {
        service: 'attendance-service',
        attendanceId,
        riskScore: data.overallRiskScore
      });

      const [record] = await db
        .update(attendanceRecords)
        .set({
          overallRiskScore: data.overallRiskScore?.toString() || null,
          fraudDetectionResults: data.fraudDetectionResults,
          status: data.overallRiskScore && data.overallRiskScore > 60 ? 'flagged' : 'active',
          updatedAt: new Date()
        })
        .where(eq(attendanceRecords.id, attendanceId))
        .returning();

      if (!record) {
        return {
          success: false,
          message: 'Attendance record not found',
          error: 'NOT_FOUND'
        };
      }

      return {
        success: true,
        message: 'Attendance record updated with fraud analysis',
        data: record as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to update attendance record with fraud analysis:', error);
      return {
        success: false,
        message: 'Failed to update attendance record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current attendance status for a user
   */
  async getCurrentAttendanceStatus(userId: string, companyId: string): Promise<AttendanceResult> {
    try {
      const [record] = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.userId, userId),
            eq(attendanceRecords.companyId, companyId),
            eq(attendanceRecords.status, 'active')
          )
        )
        .orderBy(desc(attendanceRecords.clockInTime))
        .limit(1);

      if (!record) {
        return {
          success: false,
          message: 'No active attendance found',
          error: 'NO_ACTIVE_ATTENDANCE'
        };
      }

      return {
        success: true,
        data: record as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to get current attendance status:', error);
      return {
        success: false,
        message: 'Failed to get attendance status',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get attendance history for a user
   */
  async getAttendanceHistory(
    userId: string,
    companyId: string,
    page: number = 1,
    limit: number = 10,
    startDate?: string,
    endDate?: string,
    workMode?: string
  ): Promise<AttendanceListResult> {
    try {
      const offset = (page - 1) * limit;
      
      let whereConditions = [
        eq(attendanceRecords.userId, userId),
        eq(attendanceRecords.companyId, companyId)
      ];

      if (startDate) {
        whereConditions.push(gte(attendanceRecords.clockInTime, new Date(startDate)));
      }

      if (endDate) {
        whereConditions.push(lte(attendanceRecords.clockInTime, new Date(endDate)));
      }

      if (workMode) {
        whereConditions.push(eq(attendanceRecords.workMode, workMode as any));
      }

      const [records, totalCount] = await Promise.all([
        db
          .select()
          .from(attendanceRecords)
          .where(and(...whereConditions))
          .orderBy(desc(attendanceRecords.clockInTime))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .where(and(...whereConditions))
      ]);

      const total = totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          records: records as unknown as AttendanceRecord[],
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error('Failed to get attendance history:', error);
      return {
        success: false,
        message: 'Failed to get attendance history',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get today's attendance for a user
   */
  async getTodayAttendance(userId: string, companyId: string): Promise<AttendanceListResult> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const records = await db
        .select()
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.userId, userId),
            eq(attendanceRecords.companyId, companyId),
            gte(attendanceRecords.clockInTime, today),
            lte(attendanceRecords.clockInTime, tomorrow)
          )
        )
        .orderBy(desc(attendanceRecords.clockInTime));

      return {
        success: true,
        data: {
          records: records as unknown as AttendanceRecord[],
          pagination: {
            page: 1,
            limit: records.length,
            total: records.length,
            totalPages: 1
          }
        }
      };

    } catch (error) {
      logger.error('Failed to get today attendance:', error);
      return {
        success: false,
        message: 'Failed to get today attendance',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get company-wide attendance
   */
  async getCompanyAttendance(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    date?: string,
    workMode?: string,
    status?: string
  ): Promise<AttendanceListResult> {
    try {
      const offset = (page - 1) * limit;
      
      let whereConditions = [eq(attendanceRecords.companyId, companyId)];

      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        whereConditions.push(
          gte(attendanceRecords.clockInTime, targetDate),
          lte(attendanceRecords.clockInTime, nextDay)
        );
      }

      if (workMode) {
        whereConditions.push(eq(attendanceRecords.workMode, workMode as any));
      }

      if (status) {
        whereConditions.push(eq(attendanceRecords.status, status as any));
      }

      const [records, totalCount] = await Promise.all([
        db
          .select()
          .from(attendanceRecords)
          .where(and(...whereConditions))
          .orderBy(desc(attendanceRecords.clockInTime))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .where(and(...whereConditions))
      ]);

      const total = totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          records: records as unknown as AttendanceRecord[],
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error('Failed to get company attendance:', error);
      return {
        success: false,
        message: 'Failed to get company attendance',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get flagged attendance records
   */
  async getFlaggedAttendance(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    riskLevel?: string
  ): Promise<AttendanceListResult> {
    try {
      const offset = (page - 1) * limit;
      
      let whereConditions = [
        eq(attendanceRecords.companyId, companyId),
        eq(attendanceRecords.status, 'flagged')
      ];

      if (riskLevel) {
        const riskThresholds = {
          'low': 40,
          'medium': 60,
          'high': 80
        };
        
        const threshold = riskThresholds[riskLevel as keyof typeof riskThresholds];
        if (threshold) {
          whereConditions.push(gte(attendanceRecords.overallRiskScore, threshold.toString()));
        }
      }

      const [records, totalCount] = await Promise.all([
        db
          .select()
          .from(attendanceRecords)
          .where(and(...whereConditions))
          .orderBy(desc(attendanceRecords.overallRiskScore))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(attendanceRecords)
          .where(and(...whereConditions))
      ]);

      const total = totalCount[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          records: records as unknown as AttendanceRecord[],
          pagination: {
            page,
            limit,
            total,
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error('Failed to get flagged attendance:', error);
      return {
        success: false,
        message: 'Failed to get flagged attendance',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Approve attendance record
   */
  async approveAttendance(
    attendanceId: string,
    approverId: string,
    companyId: string
  ): Promise<AttendanceResult> {
    try {
      logger.info('Approving attendance record', {
        service: 'attendance-service',
        attendanceId,
        approverId
      });

      const [record] = await db
        .update(attendanceRecords)
        .set({
          status: 'approved',
          approvedBy: approverId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(attendanceRecords.id, attendanceId),
            eq(attendanceRecords.companyId, companyId)
          )
        )
        .returning();

      if (!record) {
        return {
          success: false,
          message: 'Attendance record not found',
          error: 'NOT_FOUND'
        };
      }

      logger.info('Attendance record approved successfully', {
        service: 'attendance-service',
        attendanceId,
        approverId
      });

      return {
        success: true,
        message: 'Attendance record approved successfully',
        data: record as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to approve attendance record:', error);
      return {
        success: false,
        message: 'Failed to approve attendance record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reject attendance record
   */
  async rejectAttendance(
    attendanceId: string,
    rejectorId: string,
    companyId: string,
    reason: string
  ): Promise<AttendanceResult> {
    try {
      logger.info('Rejecting attendance record', {
        service: 'attendance-service',
        attendanceId,
        rejectorId,
        reason
      });

      const [record] = await db
        .update(attendanceRecords)
        .set({
          status: 'rejected',
          approvedBy: rejectorId,
          approvedAt: new Date(),
          rejectionReason: reason,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(attendanceRecords.id, attendanceId),
            eq(attendanceRecords.companyId, companyId)
          )
        )
        .returning();

      if (!record) {
        return {
          success: false,
          message: 'Attendance record not found',
          error: 'NOT_FOUND'
        };
      }

      logger.info('Attendance record rejected successfully', {
        service: 'attendance-service',
        attendanceId,
        rejectorId,
        reason
      });

      return {
        success: true,
        message: 'Attendance record rejected successfully',
        data: record as unknown as AttendanceRecord
      };

    } catch (error) {
      logger.error('Failed to reject attendance record:', error);
      return {
        success: false,
        message: 'Failed to reject attendance record',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
