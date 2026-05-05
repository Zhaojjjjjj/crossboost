import { NestFactory } from '@nestjs/core'
import type { INestApplication, Type } from '@nestjs/common'
import { Logger } from '@nestjs/common'

interface StartOptions {
  setupApp?: (app: INestApplication) => void
}

export async function startApplication(module: Type, config: Record<string, any>, options?: StartOptions) {
  const app = await NestFactory.create(module, { logger: ['error', 'warn', 'log'] })
  app.setGlobalPrefix('api')
  options?.setupApp?.(app)
  const port = config.port || 3000
  await app.listen(port)
  Logger.log(`Application is running on port ${port}`, 'Bootstrap')
}
