import pino from 'pino';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

export const createLogger = (logLevel: string) => {
  const isProduction = process.env.NODE_ENV === 'production';

  const targets: pino.TransportTargetOptions[] = [
    {
      level: 'trace',
      target: 'pino/file',
      options: { destination: path.join(logDir, 'combined.log') },
    },
    {
      level: 'error',
      target: 'pino/file',
      options: { destination: path.join(logDir, 'error.log') },
    },
  ];

  if (!isProduction) {
    targets.unshift({
      level: 'trace',
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      },
    });
  }

  const transport = pino.transport({ targets });

  return pino(
    {
      level: logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    transport,
  );
};

export type Logger = pino.Logger;