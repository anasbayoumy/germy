import { Request, Response } from 'express';
import { FaceEncodingService } from '../services/face-encoding.service';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import axios from 'axios';

export class FaceEncodingController {
  private readonly faceEncodingService = new FaceEncodingService();

  // Create face encoding (with AI service integration)
  async createFaceEncoding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { photo, metadata } = req.body; // Changed from encodingData to photo
      const { userId: requesterId, role: requesterRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      logger.info('Face encoding request received', {
        service: 'auth-service',
        userId,
        requesterId,
        requesterRole,
        companyId,
        hasPhoto: !!photo,
        metadata
      });

      // Validate required fields
      if (!photo) {
        res.status(400).json({
          success: false,
          message: 'Photo is required for face encoding',
          error: 'MISSING_PHOTO'
        });
        return;
      }

      // Call AI service to encode the face
      try {
        const aiServiceResponse = await axios.post(
          `${process.env.AI_SERVICE_URL || 'http://ai-service:3004'}/api/ai/encode-face`,
          {
            image: photo,
            userId,
            companyId,
            metadata: {
              ...metadata,
              requesterId,
              requesterRole,
              ipAddress,
              userAgent,
              requestSource: 'auth-service'
            }
          },
          {
            timeout: 30000, // 30 second timeout
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (!aiServiceResponse.data.success) {
          logger.warn('AI service face encoding failed', {
            service: 'auth-service',
            userId,
            error: aiServiceResponse.data.message
          });

          res.status(400).json({
            success: false,
            message: aiServiceResponse.data.message || 'Face encoding failed',
            error: 'AI_ENCODING_FAILED',
            details: aiServiceResponse.data
          });
          return;
        }

        const { encoding, qualityScore, processingTime, metadata: aiMetadata } = aiServiceResponse.data.data;

        // Store the encoding in the database
        const result = await this.faceEncodingService.createFaceEncoding(
          userId,
          encoding, // Now using the AI-generated encoding
          qualityScore,
          requesterId,
          requesterRole,
          companyId,
          ipAddress,
          userAgent
        );

        if (!result.success) {
          logger.error('Failed to store face encoding in database', {
            service: 'auth-service',
            userId,
            error: result.message
          });

          res.status(500).json({
            success: false,
            message: 'Failed to store face encoding',
            error: 'DATABASE_STORAGE_FAILED'
          });
          return;
        }

        logger.info('Face encoding completed successfully', {
          service: 'auth-service',
          userId,
          qualityScore,
          processingTime,
          encodingId: result.data?.encodingId
        });

        res.status(201).json({
          success: true,
          message: 'Face encoding created successfully',
          data: {
            ...result.data,
            aiProcessingTime: processingTime,
            aiMetadata
          }
        });

      } catch (aiError) {
        logger.error('AI service communication error:', aiError);
        
        if (axios.isAxiosError(aiError)) {
          res.status(500).json({
            success: false,
            message: 'AI service unavailable',
            error: 'AI_SERVICE_ERROR',
            details: aiError.response?.data || aiError.message
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'INTERNAL_ERROR'
          });
        }
        return;
      }

    } catch (error) {
      logger.error('Create face encoding controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR'
      });
    }
  }

  // Get face encoding
  async getFaceEncoding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requesterId, role: requesterRole, companyId } = req.user!;

      const result = await this.faceEncodingService.getFaceEncoding(
        userId,
        requesterId,
        requesterRole,
        companyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Get face encoding controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Update face encoding
  async updateFaceEncoding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { encodingData, qualityScore } = req.body;
      const { userId: requesterId, role: requesterRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.faceEncodingService.updateFaceEncoding(
        userId,
        encodingData,
        qualityScore,
        requesterId,
        requesterRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Update face encoding controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Delete face encoding
  async deleteFaceEncoding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requesterId, role: requesterRole, companyId } = req.user!;
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await this.faceEncodingService.deleteFaceEncoding(
        userId,
        requesterId,
        requesterRole,
        companyId,
        ipAddress,
        userAgent
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Delete face encoding controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get face encoding expiration status
  async getFaceEncodingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { userId: requesterId, role: requesterRole, companyId } = req.user!;

      const result = await this.faceEncodingService.getFaceEncodingStatus(
        userId,
        requesterId,
        requesterRole,
        companyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Get face encoding status controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  // Get users with expiring face encodings
  async getExpiringFaceEncodings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { days = 7 } = req.query;
      const { userId: requesterId, role: requesterRole, companyId } = req.user!;

      const result = await this.faceEncodingService.getExpiringFaceEncodings(
        Number(days),
        requesterId,
        requesterRole,
        companyId
      );

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      logger.error('Get expiring face encodings controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
