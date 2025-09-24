import app from './app';
import { env } from '@config/env';
import logger from '@utils/logger';
import { connectPrisma, disconnectPrisma } from '@config/prisma';

async function bootstrap() {
  try {
    await connectPrisma();
    const server = app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'Server is running');
    });

    const shutdown = (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectPrisma();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

void bootstrap();
