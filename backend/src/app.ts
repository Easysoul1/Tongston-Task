import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB } from './config/db.js';
import { notFoundHandler, errorHandler, rateLimitErrorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import routes from './routes/index.js';

export const createApp = (): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  app.use(rateLimitErrorHandler);

  return app;
};

export async function startApp(): Promise<void> {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Server started');
  });
}