import pino from 'pino';

export const createLogger = (logLevel: string): pino.Logger => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {

    const transport = pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname',
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      },
    });
    return pino({ level: logLevel }, transport);
  }

  return pino({
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  });
};

export type Logger = pino.Logger;