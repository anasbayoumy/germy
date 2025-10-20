export const config = {
  port: Number(process.env['PLATFORM_SERVICE_PORT'] || 3005),
  nodeEnv: process.env['NODE_ENV'] || 'development',
  corsOrigins: (process.env['CORS_ORIGINS'] || '*').split(','),
  databaseUrl: process.env['PLATFORM_DATABASE_URL'] || process.env['DATABASE_URL'] || 'postgres://postgres:postgres@db:5432/germy',
  authServiceUrl: process.env['AUTH_SERVICE_URL'] || 'http://auth-service:3001',
  userServiceUrl: process.env['USER_SERVICE_URL'] || 'http://user-service:3003',
  jwtSecret: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-at-least-32-characters-long'
};


