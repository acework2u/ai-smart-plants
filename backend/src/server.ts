import app from './app';
import { env } from '@config/env';
import logger from '@utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'Server is running');
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
