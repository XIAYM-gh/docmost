import { Injectable } from '@nestjs/common';
import RedisClient from 'ioredis';
import { createRetryStrategy, parseRedisUrl } from 'src/common/helpers';
import { EnvironmentService } from 'src/integrations/environment/environment.service';

const REDIS_KEY_PREFIX = 'history:contributors:';

@Injectable()
export class CollabHistoryService {
  private readonly redis: RedisClient;

  constructor(private readonly environmentService: EnvironmentService) {
    const redisConfig = parseRedisUrl(this.environmentService.getRedisUrl());
    this.redis = new RedisClient({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      family: redisConfig.family,
      retryStrategy: createRetryStrategy(),
    });
  }

  async addContributors(pageId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    await this.redis.sadd(REDIS_KEY_PREFIX + pageId, ...userIds);
  }

  async popContributors(pageId: string): Promise<string[]> {
    const key = REDIS_KEY_PREFIX + pageId;
    const count = await this.redis.scard(key);
    if (count === 0) return [];
    return await this.redis.spop(key, count);
  }

  async clearContributors(pageId: string): Promise<void> {
    await this.redis.del(REDIS_KEY_PREFIX + pageId);
  }
}
