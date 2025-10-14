import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env';
import { logger } from '../utils/logger';

// Create postgres connection
const connectionString = env.DATABASE_URL;
const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await client`SELECT 1`;
    logger.info('Database connection successful', {
      service: 'attendance-service'
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed:', {
      service: 'attendance-service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

// Close database connection
export async function closeConnection(): Promise<void> {
  try {
    await client.end();
    logger.info('Database connection closed', {
      service: 'attendance-service'
    });
  } catch (error) {
    logger.error('Error closing database connection:', {
      service: 'attendance-service',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default db;