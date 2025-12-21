import { Logger } from '@/infrastructure/logging/logger';

export const initializeErrorHandlers = (logger: Logger) => {
  process.on('unhandledRejection', (reason: Error | any) => {
    logger.error({ err: reason }, 'Unhandled Rejection');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
  });
};