import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import app from './app';

async function bootstrap() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(env.PORT, () => {
      logger.info(`🚀 NexoB2B API running on http://localhost:${env.PORT}`);
      logger.info(`   Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server', { error: err });
    process.exit(1);
  }
}

bootstrap();
