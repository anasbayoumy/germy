import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { logger } from '../utils/logger';
import * as schema from '../db/schema';

// Create the connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  max: 20, 
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false 
});


// Create the database instance
export const db = drizzle(client, { schema });

// Test database connection
export async function testConnection() {
  try {
    await client`SELECT 1`;
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Close database connection
export async function closeConnection() {
  await client.end();
  logger.info('Database connection closed');
}

export default db;