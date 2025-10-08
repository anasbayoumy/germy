const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Starting Auth Service Test Suite...\n');

try {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/germy_test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.PORT = '3001';

  console.log('📋 Test Environment:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not Set'}`);
  console.log(`   PORT: ${process.env.PORT}\n`);

  // Run tests
  console.log('🚀 Running tests...\n');
  execSync('npx jest --verbose --detectOpenHandles --forceExit', {
    stdio: 'inherit',
    cwd: __dirname
  });

  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}
