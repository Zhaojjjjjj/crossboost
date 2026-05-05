import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import type { RedisConfig } from './redis.module'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis
  private readonly logger = new Logger(RedisService.name)

  constructor(@Inject('REDIS_CONFIG') config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db ?? 0,
      keyPrefix: config.keyPrefix ?? '',
      retryStrategy: (times: number) => {
        if (times > 3) {
          this.logger.error('Redis connection failed after 3 retries')
          return null
        }
        return Math.min(times * 200, 2000)
      },
    })

    this.client.on('connect', () => this.logger.log('Redis connected'))
    this.client.on('error', (err) => this.logger.error('Redis error', err))
  }

  async onModuleDestroy() {
    await this.client.quit()
  }

  getClient(): Redis {
    return this.client
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key)
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl)
    } else {
      await this.client.set(key, value)
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key)
    return result === 1
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.client.expire(key, seconds)
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key)
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key)
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key)
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value)
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field)
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key)
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field)
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values)
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values)
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop)
  }

  async llen(key: string): Promise<number> {
    return this.client.llen(key)
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members)
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key)
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member)
    return result === 1
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.client.publish(channel, message)
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern)
  }

  async flushdb(): Promise<void> {
    await this.client.flushdb()
  }
}
