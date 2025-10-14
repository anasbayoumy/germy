import { z } from 'zod';

// Face encoding request schema (from Auth Service)
export const encodeFaceSchema = z.object({
  body: z.object({
    image: z.string()
      .min(1, 'Image is required')
      .refine((val) => val.startsWith('data:image/'), 'Image must be base64 encoded with data URL prefix'),
    userId: z.string()
      .uuid('Invalid userId format'),
    companyId: z.string()
      .uuid('Invalid companyId format')
      .optional(),
    metadata: z.object({
      deviceInfo: z.string().optional(),
      lighting: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
      angle: z.enum(['front', 'side', 'profile']).optional(),
      timestamp: z.string().datetime().optional(),
      imageQuality: z.number().min(0).max(1).optional(),
      faceSize: z.number().positive().optional(),
      blurLevel: z.number().min(0).max(1).optional()
    }).optional()
  })
});

// Face comparison request schema (from Attendance Service)
export const compareFacesSchema = z.object({
  body: z.object({
    encoding1: z.array(z.number())
      .length(512, 'Encoding1 must be 512-dimensional')
      .refine((arr) => arr.every(val => typeof val === 'number' && !isNaN(val)), 'Encoding1 must contain valid numbers'),
    encoding2: z.array(z.number())
      .length(512, 'Encoding2 must be 512-dimensional')
      .refine((arr) => arr.every(val => typeof val === 'number' && !isNaN(val)), 'Encoding2 must contain valid numbers'),
    userId: z.string()
      .uuid('Invalid userId format'),
    companyId: z.string()
      .uuid('Invalid companyId format')
      .optional(),
    attendanceId: z.string()
      .uuid('Invalid attendanceId format')
      .optional(),
    metadata: z.object({
      clockInTime: z.string().datetime().optional(),
      location: z.object({
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        accuracy: z.number().positive().optional()
      }).optional(),
      deviceInfo: z.string().optional(),
      userAgent: z.string().optional(),
      ipAddress: z.string().ip().optional(),
      workMode: z.enum(['onsite', 'remote', 'hybrid']).optional(),
      expectedLocation: z.string().optional()
    }).optional()
  })
});

// Model info response schema
export const modelInfoSchema = z.object({
  modelVersion: z.string(),
  embeddingSize: z.number(),
  similarityThreshold: z.number(),
  qualityThreshold: z.number(),
  loaded: z.boolean()
});

// Face encoding response schema
export const faceEncodingResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    encoding: z.array(z.number()).length(512),
    qualityScore: z.number().min(0).max(1),
    processingTime: z.number().positive(),
    metadata: z.object({
      modelVersion: z.string(),
      faceDetected: z.boolean(),
      confidence: z.number().min(0).max(1),
      boundingBox: z.object({
        x: z.number(),
        y: z.number(),
        width: z.number(),
        height: z.number()
      }).optional(),
      landmarks: z.array(z.object({
        x: z.number(),
        y: z.number()
      })).optional(),
      imageSize: z.object({
        width: z.number(),
        height: z.number()
      }),
      preprocessing: z.object({
        resized: z.boolean(),
        normalized: z.boolean(),
        aligned: z.boolean()
      })
    })
  }).optional(),
  error: z.string().optional(),
  processingTime: z.number().positive().optional(),
  metadata: z.any().optional()
});

// Face comparison response schema
export const faceComparisonResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    similarity: z.number().min(-1).max(1),
    isMatch: z.boolean(),
    processingTime: z.number().positive(),
    metadata: z.object({
      modelVersion: z.string(),
      threshold: z.number(),
      encoding1Quality: z.number().min(0).max(1),
      encoding2Quality: z.number().min(0).max(1),
      comparisonMethod: z.string()
    })
  }).optional(),
  error: z.string().optional(),
  processingTime: z.number().positive().optional(),
  metadata: z.any().optional()
});

// Fraud analysis request schema (from Attendance Service)
export const analyzeFraudSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid userId format'),
    companyId: z.string().uuid('Invalid companyId format'),
    attendanceId: z.string().uuid('Invalid attendanceId format').optional(),
    clockInTime: z.string().datetime('Invalid clockInTime format'),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      accuracy: z.number().positive()
    }).optional(),
    deviceInfo: z.string().optional(),
    userAgent: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    workMode: z.enum(['onsite', 'remote', 'hybrid']),
    expectedLocation: z.string().optional(),
    faceSimilarity: z.number().min(-1).max(1).optional(),
    previousLocations: z.array(z.object({
      latitude: z.number(),
      longitude: z.number(),
      timestamp: z.string().datetime()
    })).optional(),
    previousDevices: z.array(z.string()).optional(),
    attendanceHistory: z.array(z.object({
      clockInTime: z.string().datetime(),
      location: z.any().optional(),
      deviceInfo: z.string().optional()
    })).optional(),
    metadata: z.any().optional()
  })
});

// Fraud analysis response schema
export const fraudAnalysisResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    riskScore: z.number().min(0).max(100),
    riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
    isFraudulent: z.boolean(),
    processingTime: z.number().positive(),
    metadata: z.object({
      modelVersion: z.string(),
      detectionResults: z.object({
        locationAnomaly: z.boolean(),
        timeAnomaly: z.boolean(),
        deviceAnomaly: z.boolean(),
        behavioralAnomaly: z.boolean(),
        patternAnomaly: z.boolean()
      }),
      confidence: z.number().min(0).max(1),
      flags: z.array(z.string()),
      evidence: z.any()
    })
  }).optional(),
  error: z.string().optional(),
  processingTime: z.number().positive().optional()
});

// Health check response schema
export const healthCheckResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    service: z.string(),
    status: z.enum(['healthy', 'unhealthy']),
    timestamp: z.string().datetime(),
    model: modelInfoSchema
  })
});

// Export all schemas
export const aiSchemas = {
  encodeFaceSchema,
  compareFacesSchema,
  analyzeFraudSchema,
  modelInfoSchema,
  faceEncodingResponseSchema,
  faceComparisonResponseSchema,
  fraudAnalysisResponseSchema,
  healthCheckResponseSchema
};
