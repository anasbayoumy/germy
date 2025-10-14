import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';
import { logger } from '../utils/logger';

// Create postgres client
const client = postgres(env.DATABASE_URL, {
  max: 20, // Maximum connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Create drizzle instance
export const db = drizzle(client);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    logger.info('AI Service database connection successful');
    return true;
  } catch (error) {
    logger.error('AI Service database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  try {
    await client.end();
    logger.info('AI Service database connection closed');
  } catch (error) {
    logger.error('Error closing AI Service database connection:', error);
  }
}

// Health check for database
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    await client`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// AI Service specific database operations
export async function getAIServiceStats(): Promise<{
  totalFaceEncodings: number;
  totalVerifications: number;
  totalFraudDetections: number;
  totalChatMessages: number;
}> {
  try {
    const [faceEncodings, verifications, fraudDetections, chatMessages] = await Promise.all([
      client`SELECT COUNT(*) as count FROM face_encodings`,
      client`SELECT COUNT(*) as count FROM ai_verification_results`,
      client`SELECT COUNT(*) as count FROM fraud_detection_results`,
      client`SELECT COUNT(*) as count FROM ai_service_logs WHERE service_name = 'gemini_chat'`,
    ]);

    return {
      totalFaceEncodings: parseInt(faceEncodings[0]?.count || '0'),
      totalVerifications: parseInt(verifications[0]?.count || '0'),
      totalFraudDetections: parseInt(fraudDetections[0]?.count || '0'),
      totalChatMessages: parseInt(chatMessages[0]?.count || '0'),
    };
  } catch (error) {
    logger.error('Error getting AI service stats:', error);
    return {
      totalFaceEncodings: 0,
      totalVerifications: 0,
      totalFraudDetections: 0,
      totalChatMessages: 0,
    };
  }
}

// Cleanup old AI service logs
export async function cleanupOldLogs(daysOld: number = 30): Promise<number> {
  try {
    const result = await client`
      DELETE FROM ai_service_logs 
      WHERE created_at < NOW() - INTERVAL '${daysOld} days'
    `;
    
    const deletedCount = result.count || 0;
    logger.info(`Cleaned up ${deletedCount} old AI service logs`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old AI service logs:', error);
    return 0;
  }
}

// Get AI service performance metrics
export async function getAIServiceMetrics(): Promise<{
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
}> {
  try {
    const metrics = await client`
      SELECT 
        AVG(processing_time) as avg_processing_time,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN status = 'error' THEN 1 END) as error_requests
      FROM ai_service_logs 
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    const data = metrics[0];
    const totalRequests = parseInt(data?.total_requests || '0');
    const successfulRequests = parseInt(data?.successful_requests || '0');
    const errorRequests = parseInt(data?.error_requests || '0');

    return {
      averageProcessingTime: parseFloat(data?.avg_processing_time || '0'),
      successRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
      errorRate: totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0,
      totalRequests,
    };
  } catch (error) {
    logger.error('Error getting AI service metrics:', error);
    return {
      averageProcessingTime: 0,
      successRate: 0,
      errorRate: 0,
      totalRequests: 0,
    };
  }
}
