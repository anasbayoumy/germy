import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import platformRoutes from './routes/platform.routes';

const app = express();

app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'platform-service', env: config.nodeEnv });
});

app.use('/api/platform', platformRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    app.listen(config.port, () => {
      logger.info(`Platform Service running on port ${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start Platform Service', { err });
    process.exit(1);
  }
}

start();


