import { AppContainer } from '@/core/app-container';
import { RedisService } from '@/infrastructure/redis/redis.service';

export function loadRedisModule(container: AppContainer): void {
  container.register(RedisService, new RedisService());
}