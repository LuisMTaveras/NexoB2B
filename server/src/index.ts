import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { getQueue, stopQueue } from './lib/queue';
import { startSyncWorker } from './modules/sync/worker';
import { loadSchedules } from './lib/scheduler';
import app from './app';

async function bootstrap() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start pg-boss queue (connects to same PostgreSQL)
    await getQueue();
    logger.info('✅ Queue (pg-boss) connected');

    // Start background worker that processes sync jobs
    await startSyncWorker();
    logger.info('✅ Sync worker started');

    // Load all active cron schedules from database
    await loadSchedules();
    logger.info('✅ Scheduler loaded');

    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 NexoB2B API running on http://localhost:${env.PORT}`);
      logger.info(`   Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await stopQueue();
        await prisma.$disconnect();
        logger.info('👋 Server shut down cleanly');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err: any) {
    logger.error('❌ Failed to start server', { 
      message: err.message, 
      stack: err.stack,
      error: err 
    });
    process.exit(1);
  }
}

bootstrap();
