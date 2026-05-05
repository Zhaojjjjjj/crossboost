import { databaseConfigSchema } from '@crossboost/database'
import { redisConfigSchema } from '@crossboost/redis'
import { baseConfig, createZodDto, selectConfig } from '@crossboost/common'
import { z } from 'zod'

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  database: databaseConfigSchema,
  redis: redisConfigSchema,
  jwtSecret: z.string().default('crossboost-jwt-secret'),
  internalToken: z.string().default('change-this-secret-token'),
  aiServiceUrl: z.string().default('http://localhost:3010'),
  assets: z.object({
    endpoint: z.string().default(''),
    bucket: z.string().default(''),
    accessKey: z.string().default(''),
    secretKey: z.string().default(''),
  }),
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
