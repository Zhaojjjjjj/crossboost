import { baseConfig, createZodDto, selectConfig } from '@crossboost/common'
import { z } from 'zod'

const s3ConfigSchema = z.object({
  endpoint: z.string().default(''),
  bucket: z.string().default(''),
  accessKey: z.string().default(''),
  secretKey: z.string().default(''),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  mongodbUri: z.string().default('mongodb://localhost:27017/crossboost'),
  redisUrl: z.string().default('redis://localhost:6379'),
  jwtSecret: z.string().default('crossboost-jwt-secret'),
  aiServiceUrl: z.string().default('http://localhost:3010'),
  s3: s3ConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
