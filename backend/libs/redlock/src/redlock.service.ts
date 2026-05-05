import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common'
import Redis from 'ioredis'
import Redlock from 'redlock'
import type { RedlockConfig } from './redlock.module'

@Injectable()
export class RedlockService implements OnModuleDestroy {
  private readonly redlock: Redlock
  private readonly redis: Redis
  private readonly logger = new Logger(RedlockService.name)

  constructor(@Inject('REDLOCK_CONFIG') config: RedlockConfig) {
    this.redis = new Redis({
      host: config.connection.host,
      port: config.connection.port,
      password: config.connection.password,
    })

    this.redlock = new Redlock([this.redis], {
      driftFactor: config.driftFactor ?? 0.01,
      retryCount: config.retryCount ?? 10,
      retryDelay: config.retryDelay ?? 200,
    })

    this.redlock.on('error', (err) => {
      this.logger.error('Redlock error', err)
    })
  }

  async onModuleDestroy() {
    await this.redlock.quit()
    await this.redis.quit()
  }

  /**
   * Acquire a distributed lock
   * @param resource - The resource identifier to lock
   * @param ttl - Time-to-live in milliseconds (default: 10000)
   * @returns The lock object (call lock.release() when done)
   */
  async acquire(resource: string, ttl = 10000): Promise<Redlock.Lock> {
    return this.redlock.acquire([`lock:${resource}`], ttl)
  }

  /**
   * Execute a function with a distributed lock held
   * @param resource - The resource identifier to lock
   * @param fn - The function to execute while holding the lock
   * @param ttl - Time-to-live in milliseconds (default: 10000)
   */
  async withLock<T>(resource: string, fn: () => Promise<T>, ttl = 10000): Promise<T> {
    const lock = await this.acquire(resource, ttl)
    try {
      return await fn()
    } finally {
      await lock.release()
    }
  }
}
