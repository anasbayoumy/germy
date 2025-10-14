import { Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import axios from 'axios';

export class AttendanceController {
  private readonly attendanceService = new AttendanceService();

  /**
   * Clock in with photo verification
   * POST /api/attendance/clock-in
   */
  async clockIn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId, workMode, location, deviceInfo, userAgent } = req.body;
      const photo = req.file;
      const ipAddress = req.ip || 'unknown';

      logger.info('Clock-in request received', {
        service: 'attendance-service',
        userId,
        companyId,
        workMode,
        hasPhoto: !!photo,
        location,
        deviceInfo
      });

      // Validate required fields
      if (!photo) {
        res.status(400).json({
          success: false,
          message: 'Photo is required for clock-in',
          error: 'MISSING_PHOTO'
        });
        return;
      }

      if (!userId || !companyId || !workMode) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, companyId, and workMode are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Convert photo to base64 for AI service
      const photoBase64 = `data:${photo.mimetype};base64,${photo.buffer.toString('base64')}`;

      // Get user's stored face encoding from Auth Service
      let storedEncoding: number[] | null = null;
      try {
        const authServiceResponse = await axios.get(
          `${process.env['AUTH_SERVICE_URL'] || 'http://auth-service:3001'}/api/auth/face-encoding/${userId}`,
          {
            headers: {
              'Authorization': req.headers.authorization || ''
            }
          }
        );

        if (authServiceResponse.data.success && authServiceResponse.data.data?.encoding) {
          storedEncoding = authServiceResponse.data.data.encoding;
        }
      } catch (error) {
        logger.warn('Failed to get stored face encoding', {
          service: 'attendance-service',
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      if (!storedEncoding) {
        res.status(400).json({
          success: false,
          message: 'No face encoding found for user. Please register your face first.',
          error: 'NO_FACE_ENCODING'
        });
        return;
      }

      // Generate new face encoding from clock-in photo
      let newEncoding: number[] | null = null;
      let faceSimilarity = 0;
      let faceVerificationSuccess = false;

      try {
        const aiServiceResponse = await axios.post(
          `${process.env['AI_SERVICE_URL'] || 'http://ai-service:3004'}/api/ai/encode-face`,
          {
            image: photoBase64,
            userId,
            companyId,
            metadata: {
              requestSource: 'attendance-service',
              operation: 'clock-in',
              timestamp: new Date().toISOString()
            }
          }
        );

        if (aiServiceResponse.data.success) {
          newEncoding = aiServiceResponse.data.data.encoding;
          
          // Compare faces
          const comparisonResponse = await axios.post(
            `${process.env['AI_SERVICE_URL'] || 'http://ai-service:3004'}/api/ai/compare-faces`,
            {
              encoding1: storedEncoding,
              encoding2: newEncoding,
              userId,
              companyId,
              attendanceId: null, // Will be set after creating attendance record
              metadata: {
                requestSource: 'attendance-service',
                operation: 'clock-in-verification'
              }
            }
          );

          if (comparisonResponse.data.success) {
            faceSimilarity = comparisonResponse.data.data.similarity;
            faceVerificationSuccess = comparisonResponse.data.data.isMatch;
          }
        }
      } catch (error) {
        logger.error('AI service communication error during clock-in:', error);
        res.status(500).json({
          success: false,
          message: 'Face verification failed',
          error: 'AI_SERVICE_ERROR'
        });
        return;
      }

      if (!faceVerificationSuccess) {
        res.status(400).json({
          success: false,
          message: 'Face verification failed. Please try again.',
          error: 'FACE_VERIFICATION_FAILED',
          data: {
            faceSimilarity,
            threshold: 0.6
          }
        });
        return;
      }

      // Create attendance record
      const attendanceData = {
        userId,
        companyId,
        clockInTime: new Date(),
        workMode,
        location,
        deviceInfo,
        userAgent,
        ipAddress,
        photoUrl: photoBase64,
        faceSimilarity,
        livenessScore: 0.95, // Mock liveness score
        activityScore: 0.85, // Mock activity score
        productivityScore: 0.80, // Mock productivity score
        overallRiskScore: 0, // Will be updated after fraud analysis
        aiProcessingTime: 0, // Will be updated after fraud analysis
        verificationMetadata: {
          faceVerification: {
            success: faceVerificationSuccess,
            similarity: faceSimilarity,
            threshold: 0.6
          },
          livenessVerification: {
            success: true,
            score: 0.95
          }
        }
      };

      const result = await this.attendanceService.createAttendanceRecord(attendanceData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      // Perform fraud analysis
      try {
        const fraudAnalysisResponse = await axios.post(
          `${process.env['AI_SERVICE_URL'] || 'http://ai-service:3004'}/api/ai/analyze-fraud`,
          {
            userId,
            companyId,
            attendanceId: result.data?.id,
            clockInTime: attendanceData.clockInTime.toISOString(),
            location,
            deviceInfo,
            userAgent,
            ipAddress,
            workMode,
            faceSimilarity,
            metadata: {
              requestSource: 'attendance-service',
              operation: 'clock-in-fraud-analysis'
            }
          }
        );

        if (fraudAnalysisResponse.data.success) {
          const fraudData = fraudAnalysisResponse.data.data;
          
          // Update attendance record with fraud analysis results
          await this.attendanceService.updateAttendanceFraudAnalysis(
            result.data?.id!,
            {
              overallRiskScore: fraudData.riskScore,
              fraudDetectionResults: {
                riskScore: fraudData.riskScore,
                riskLevel: fraudData.riskLevel,
                isFraudulent: fraudData.isFraudulent,
                detectionResults: fraudData.metadata.detectionResults,
                flags: fraudData.metadata.flags,
                evidence: fraudData.metadata.evidence
              }
            }
          );
        }
      } catch (error) {
        logger.error('Fraud analysis failed during clock-in:', error);
        // Don't fail the clock-in if fraud analysis fails
      }

      logger.info('Clock-in completed successfully', {
        service: 'attendance-service',
        userId,
        attendanceId: result.data?.id,
        faceSimilarity,
        workMode
      });

      res.status(201).json({
        success: true,
        message: 'Clock-in successful',
        data: {
          ...result.data,
          faceVerification: {
            success: faceVerificationSuccess,
            similarity: faceSimilarity
          }
        }
      });

    } catch (error) {
      logger.error('Clock-in controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Clock out with photo verification
   * POST /api/attendance/clock-out
   */
  async clockOut(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, companyId, attendanceId } = req.body;
      const photo = req.file;

      logger.info('Clock-out request received', {
        service: 'attendance-service',
        userId,
        companyId,
        attendanceId,
        hasPhoto: !!photo
      });

      // Validate required fields
      if (!photo) {
        res.status(400).json({
          success: false,
          message: 'Photo is required for clock-out',
          error: 'MISSING_PHOTO'
        });
        return;
      }

      if (!userId || !companyId || !attendanceId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, companyId, and attendanceId are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Get the attendance record
      const attendanceRecord = await this.attendanceService.getAttendanceRecord(attendanceId);
      if (!attendanceRecord.success || !attendanceRecord.data) {
        res.status(404).json({
          success: false,
          message: 'Attendance record not found',
          error: 'ATTENDANCE_NOT_FOUND'
        });
        return;
      }

      // Verify the user owns this attendance record
      if (attendanceRecord.data.userId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
          error: 'ACCESS_DENIED'
        });
        return;
      }

      // Check if already clocked out
      if (attendanceRecord.data.clockOutTime) {
        res.status(400).json({
          success: false,
          message: 'Already clocked out',
          error: 'ALREADY_CLOCKED_OUT'
        });
        return;
      }

      // Convert photo to base64 for AI service
      const photoBase64 = `data:${photo.mimetype};base64,${photo.buffer.toString('base64')}`;

      // Get user's stored face encoding
      let storedEncoding: number[] | null = null;
      try {
        const authServiceResponse = await axios.get(
          `${process.env['AUTH_SERVICE_URL'] || 'http://auth-service:3001'}/api/auth/face-encoding/${userId}`,
          {
            headers: {
              'Authorization': req.headers.authorization || ''
            }
          }
        );

        if (authServiceResponse.data.success && authServiceResponse.data.data?.encoding) {
          storedEncoding = authServiceResponse.data.data.encoding;
        }
      } catch (error) {
        logger.warn('Failed to get stored face encoding for clock-out', {
          service: 'attendance-service',
          userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      let faceVerificationSuccess = false;
      let faceSimilarity = 0;

      if (storedEncoding) {
        // Generate new face encoding from clock-out photo
        try {
          const aiServiceResponse = await axios.post(
            `${process.env['AI_SERVICE_URL'] || 'http://ai-service:3004'}/api/ai/encode-face`,
            {
              image: photoBase64,
              userId,
              companyId,
              metadata: {
                requestSource: 'attendance-service',
                operation: 'clock-out',
                timestamp: new Date().toISOString()
              }
            }
          );

          if (aiServiceResponse.data.success) {
            const newEncoding = aiServiceResponse.data.data.encoding;
            
            // Compare faces
            const comparisonResponse = await axios.post(
              `${process.env['AI_SERVICE_URL'] || 'http://ai-service:3004'}/api/ai/compare-faces`,
              {
                encoding1: storedEncoding,
                encoding2: newEncoding,
                userId,
                companyId,
                attendanceId,
                metadata: {
                  requestSource: 'attendance-service',
                  operation: 'clock-out-verification'
                }
              }
            );

            if (comparisonResponse.data.success) {
              faceSimilarity = comparisonResponse.data.data.similarity;
              faceVerificationSuccess = comparisonResponse.data.data.isMatch;
            }
          }
        } catch (error) {
          logger.error('AI service communication error during clock-out:', error);
          // Don't fail clock-out if face verification fails
        }
      }

      // Update attendance record with clock-out
      const clockOutData = {
        clockOutTime: new Date(),
        clockOutPhotoUrl: photoBase64,
        faceSimilarityClockOut: faceSimilarity,
        livenessScoreClockOut: 0.95, // Mock liveness score
        verificationMetadataClockOut: {
          faceVerification: {
            success: faceVerificationSuccess,
            similarity: faceSimilarity,
            threshold: 0.6
          },
          livenessVerification: {
            success: true,
            score: 0.95
          }
        }
      };

      const result = await this.attendanceService.updateAttendanceClockOut(attendanceId, clockOutData);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      logger.info('Clock-out completed successfully', {
        service: 'attendance-service',
        userId,
        attendanceId,
        faceSimilarity,
        workDuration: result.data?.clockOutTime ? 'calculated' : 'pending'
      });

      res.json({
        success: true,
        message: 'Clock-out successful',
        data: {
          ...result.data,
          faceVerification: {
            success: faceVerificationSuccess,
            similarity: faceSimilarity
          }
        }
      });

    } catch (error) {
      logger.error('Clock-out controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get attendance status for a user
   * GET /api/attendance/status/:userId
   */
  async getAttendanceStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { companyId } = req.user!;

      if (!userId || !companyId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.getCurrentAttendanceStatus(userId, companyId);

      if (!result.success) {
        res.status(404).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Get attendance status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get attendance history for a user
   * GET /api/attendance/history/:userId
   */
  async getAttendanceHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { companyId } = req.user!;
      const { page = 1, limit = 10, startDate, endDate, workMode } = req.query;

      if (!userId || !companyId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.getAttendanceHistory(
        userId,
        companyId,
        Number(page),
        Number(limit),
        startDate as string,
        endDate as string,
        workMode as string
      );

      res.json(result);
    } catch (error) {
      logger.error('Get attendance history controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get today's attendance for a user
   * GET /api/attendance/today/:userId
   */
  async getTodayAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { companyId } = req.user!;

      if (!userId || !companyId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.getTodayAttendance(userId, companyId);

      res.json(result);
    } catch (error) {
      logger.error('Get today attendance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get company-wide attendance
   * GET /api/attendance/company
   */
  async getCompanyAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId } = req.user!;
      const { page = 1, limit = 20, date, workMode, status } = req.query;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Missing company ID',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.getCompanyAttendance(
        companyId,
        Number(page),
        Number(limit),
        date as string,
        workMode as string,
        status as string
      );

      res.json(result);
    } catch (error) {
      logger.error('Get company attendance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get flagged attendance records
   * GET /api/attendance/flagged
   */
  async getFlaggedAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { companyId } = req.user!;
      const { page = 1, limit = 20, riskLevel } = req.query;

      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Missing company ID',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.getFlaggedAttendance(
        companyId,
        Number(page),
        Number(limit),
        riskLevel as string
      );

      res.json(result);
    } catch (error) {
      logger.error('Get flagged attendance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Approve attendance record
   * POST /api/attendance/:attendanceId/approve
   */
  async approveAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attendanceId } = req.params;
      const { companyId, userId: approverId } = req.user!;

      if (!attendanceId || !companyId || !approverId) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.approveAttendance(
        attendanceId,
        approverId,
        companyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Approve attendance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Reject attendance record
   * POST /api/attendance/:attendanceId/reject
   */
  async rejectAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { attendanceId } = req.params;
      const { companyId, userId: rejectorId } = req.user!;
      const { reason } = req.body;

      if (!attendanceId || !companyId || !rejectorId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Missing required parameters',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      const result = await this.attendanceService.rejectAttendance(
        attendanceId,
        rejectorId,
        companyId,
        reason
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Reject attendance controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }
}
