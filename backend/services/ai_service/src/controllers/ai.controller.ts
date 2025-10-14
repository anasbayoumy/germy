import { Request, Response } from 'express';
import { ArcFaceService, FaceEncodingResult, FaceComparisonResult } from '../services/arcface.service';
import { FraudDetectionService, FraudDetectionResult, FraudAnalysisData } from '../services/fraud-detection.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AIController {
  private readonly arcFaceService = new ArcFaceService();
  private readonly fraudDetectionService = new FraudDetectionService();

  /**
   * Encode face from image data (called by Auth Service)
   * POST /api/ai/encode-face
   */
  async encodeFace(req: Request, res: Response): Promise<void> {
    try {
      const { image, userId, companyId, metadata } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      logger.info('Face encoding request received', {
        service: 'ai-service',
        userId,
        companyId,
        ipAddress,
        userAgent,
        imageSize: image ? image.length : 0,
        metadata
      });

      // Validate required fields
      if (!image || !userId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: image and userId are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate base64 image format
      if (!this.isValidBase64Image(image)) {
        res.status(400).json({
          success: false,
          message: 'Invalid image format. Expected base64 encoded image.',
          error: 'INVALID_IMAGE_FORMAT'
        });
        return;
      }

      // Process face encoding with ArcFace model
      const result: FaceEncodingResult = await this.arcFaceService.encodeFace(
        image,
        userId,
        {
          ...metadata,
          companyId,
          ipAddress,
          userAgent,
          requestType: 'encoding'
        }
      );

      if (!result.success) {
        logger.warn('Face encoding failed', {
          service: 'ai-service',
          userId,
          error: result.error,
          processingTime: result.processingTime
        });

        res.status(400).json({
          success: false,
          message: result.error || 'Face encoding failed',
          error: 'ENCODING_FAILED',
          processingTime: result.processingTime,
          metadata: result.metadata
        });
        return;
      }

      logger.info('Face encoding completed successfully', {
        service: 'ai-service',
        userId,
        qualityScore: result.qualityScore,
        processingTime: result.processingTime
      });

      res.json({
        success: true,
        message: 'Face encoding completed successfully',
        data: {
          encoding: result.encoding,
          qualityScore: result.qualityScore,
          processingTime: result.processingTime,
          metadata: result.metadata
        }
      });

    } catch (error) {
      logger.error('Face encoding controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Compare face encodings (called by Attendance Service)
   * POST /api/ai/compare-faces
   */
  async compareFaces(req: Request, res: Response): Promise<void> {
    try {
      const { encoding1, encoding2, userId, companyId, attendanceId, metadata } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      logger.info('Face comparison request received', {
        service: 'ai-service',
        userId,
        companyId,
        attendanceId,
        ipAddress,
        userAgent,
        encoding1Length: encoding1 ? encoding1.length : 0,
        encoding2Length: encoding2 ? encoding2.length : 0,
        metadata
      });

      // Validate required fields
      if (!encoding1 || !encoding2 || !userId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: encoding1, encoding2, and userId are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Validate encoding format
      if (!Array.isArray(encoding1) || !Array.isArray(encoding2)) {
        res.status(400).json({
          success: false,
          message: 'Invalid encoding format. Expected arrays of numbers.',
          error: 'INVALID_ENCODING_FORMAT'
        });
        return;
      }

      // Process face comparison with ArcFace model
      const result: FaceComparisonResult = await this.arcFaceService.compareFaces(
        encoding1,
        encoding2,
        userId,
        {
          ...metadata,
          companyId,
          attendanceId,
          ipAddress,
          userAgent,
          requestType: 'comparison'
        }
      );

      if (!result.success) {
        logger.warn('Face comparison failed', {
          service: 'ai-service',
          userId,
          attendanceId,
          error: result.error,
          processingTime: result.processingTime
        });

        res.status(400).json({
          success: false,
          message: result.error || 'Face comparison failed',
          error: 'COMPARISON_FAILED',
          processingTime: result.processingTime,
          metadata: result.metadata
        });
        return;
      }

      logger.info('Face comparison completed', {
        service: 'ai-service',
        userId,
        attendanceId,
        similarity: result.similarity,
        isMatch: result.isMatch,
        processingTime: result.processingTime
      });

      res.json({
        success: true,
        message: 'Face comparison completed successfully',
        data: {
          similarity: result.similarity,
          isMatch: result.isMatch,
          processingTime: result.processingTime,
          metadata: result.metadata
        }
      });

    } catch (error) {
      logger.error('Face comparison controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Get model information and status
   * GET /api/ai/model-info
   */
  async getModelInfo(req: Request, res: Response): Promise<void> {
    try {
      const modelInfo = this.arcFaceService.getModelInfo();
      
      res.json({
        success: true,
        message: 'Model information retrieved successfully',
        data: modelInfo
      });

    } catch (error) {
      logger.error('Get model info controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Analyze attendance for fraud (called by Attendance Service)
   * POST /api/ai/analyze-fraud
   */
  async analyzeFraud(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        companyId,
        attendanceId,
        clockInTime,
        location,
        deviceInfo,
        userAgent,
        ipAddress,
        workMode,
        expectedLocation,
        faceSimilarity,
        previousLocations,
        previousDevices,
        attendanceHistory,
        metadata
      } = req.body;
      const requestIpAddress = req.ip;
      const requestUserAgent = req.get('User-Agent');

      logger.info('Fraud analysis request received', {
        service: 'ai-service',
        userId,
        companyId,
        attendanceId,
        workMode,
        hasLocation: !!location,
        hasDeviceInfo: !!deviceInfo,
        faceSimilarity,
        metadata
      });

      // Validate required fields
      if (!userId || !companyId || !clockInTime || !workMode) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, companyId, clockInTime, and workMode are required',
          error: 'VALIDATION_ERROR'
        });
        return;
      }

      // Prepare fraud analysis data
      const fraudData: FraudAnalysisData = {
        userId,
        companyId,
        attendanceId,
        clockInTime,
        location,
        deviceInfo,
        userAgent: userAgent || requestUserAgent,
        ipAddress: ipAddress || requestIpAddress,
        workMode,
        expectedLocation,
        faceSimilarity,
        previousLocations,
        previousDevices,
        attendanceHistory,
        ...metadata
      };

      // Process fraud analysis
      const result: FraudDetectionResult = await this.fraudDetectionService.analyzeFraud(
        fraudData,
        {
          ...metadata,
          requestIpAddress,
          requestUserAgent,
          requestSource: 'attendance-service'
        }
      );

      if (!result.success) {
        logger.warn('Fraud analysis failed', {
          service: 'ai-service',
          userId,
          attendanceId,
          error: result.error,
          processingTime: result.processingTime
        });

        res.status(400).json({
          success: false,
          message: result.error || 'Fraud analysis failed',
          error: 'FRAUD_ANALYSIS_FAILED',
          processingTime: result.processingTime
        });
        return;
      }

      logger.info('Fraud analysis completed', {
        service: 'ai-service',
        userId,
        attendanceId,
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        isFraudulent: result.isFraudulent,
        processingTime: result.processingTime
      });

      res.json({
        success: true,
        message: 'Fraud analysis completed successfully',
        data: {
          riskScore: result.riskScore,
          riskLevel: result.riskLevel,
          isFraudulent: result.isFraudulent,
          processingTime: result.processingTime,
          metadata: result.metadata
        }
      });

    } catch (error) {
      logger.error('Fraud analysis controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * Health check for AI service
   * GET /api/ai/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const arcFaceInfo = this.arcFaceService.getModelInfo();
      const fraudDetectionInfo = this.fraudDetectionService.getModelInfo();
      
      res.json({
        success: true,
        message: 'AI service is healthy',
        data: {
          service: 'ai-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          models: {
            arcface: arcFaceInfo,
            fraudDetection: fraudDetectionInfo
          }
        }
      });

    } catch (error) {
      logger.error('Health check controller error:', error);
      res.status(500).json({
        success: false,
        message: 'AI service is unhealthy',
        error: 'SERVICE_UNHEALTHY'
      });
    }
  }

  /**
   * Validate base64 image format
   */
  private isValidBase64Image(base64String: string): boolean {
    try {
      // Check if it's a valid base64 string
      if (!/^data:image\/(jpeg|jpg|png|gif|bmp);base64,/.test(base64String)) {
        return false;
      }

      // Extract the base64 part
      const base64Data = base64String.split(',')[1];
      
      // Check if it's valid base64
      const buffer = Buffer.from(base64Data, 'base64');
      const base64String2 = buffer.toString('base64');
      
      return base64Data === base64String2;
    } catch (error) {
      return false;
    }
  }
}
