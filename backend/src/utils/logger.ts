import pino from 'pino';
import type { LoggerOptions } from 'pino';
import { env } from '@config/env';

const options: LoggerOptions = {
  name: env.APP_NAME,
  level: env.LOG_LEVEL
};

if (env.NODE_ENV === 'development') {
  // Use console pretty transport in dev without relying on additional packages
  options.transport = {
    target: 'pino/file',
    options: { destination: 1, colorize: true }
  };
}

export default pino(options);
