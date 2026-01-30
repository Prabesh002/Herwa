import Redis, { type Redis as RedisClient } from 'ioredis';
import { AppContainer } from '@/core/app-container';
import { ConfigService } from '@/infrastructure/config/config.service';
import { createLogger, Logger } from '@/infrastructure/logging/logger';

export class RedisService {
  private readonly client: RedisClient;
  private readonly logger: Logger;

  constructor() {
    const config = AppContainer.getInstance().get(ConfigService).get();
    this.logger = createLogger(config.logLevel).child({ service: 'Redis' });

    this.client = new Redis({
      host: config.redisHost,
      port: config.redisPort,
      password: config.redisPassword,
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.client.on('error', (err) => {
      this.logger.error({ err }, 'Redis connection error');
    });

    this.client.on('connect', () => {
      this.logger.info('Redis connected successfully');
    });
  }

  public async connect(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connecting') return;
    await this.client.connect();
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }

  public getClient(): RedisClient {
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  public async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds);
  }

  public async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }
}