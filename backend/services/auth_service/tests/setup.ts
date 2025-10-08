import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/germy_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.PORT = process.env.PORT || '3001';

// Global test timeout
jest.setTimeout(30000);
