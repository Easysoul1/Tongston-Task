import { startApp } from './app.js';
import { logger } from './config/logger.js';

startApp().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});