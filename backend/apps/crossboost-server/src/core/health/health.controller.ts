import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1')
      return {
        status: 'ok',
        service: 'crossboost-server',
        timestamp: new Date().toISOString(),
        database: 'connected',
      }
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'crossboost-server',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
