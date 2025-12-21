import pino from 'pino';
import path from 'path';

const logDir = path.join(process.cwd(), 'logs');

export const createLogger = (logLevel: string) => {
  const transport = pino.transport({
    targets: [
      {
        level: 'trace',
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        },
      },
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
    ],
  });

  return pino(
    {
      level: logLevel,
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    transport,
  );
};

export type Logger = pino.Logger;