import pino from 'pino';
import { environment } from '@/config/environment';

const logger = pino({
  level: environment.nodeEnv === 'production' ? 'info' : 'debug',
  transport:
    environment.nodeEnv === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true },
        },
});

export default logger;