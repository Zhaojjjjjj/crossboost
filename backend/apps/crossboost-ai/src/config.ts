import { databaseConfigSchema } from '@crossboost/database'
import { redisConfigSchema } from '@crossboost/redis'
import { baseConfig, createZodDto, selectConfig } from '@crossboost/common'
import { z } from 'zod'

export const aiConfigSchema = z.object({
  openai: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().default('https://api.openai.com/v1'),
  }),
  anthropic: z.object({
    apiKey: z.string().optional(),
    baseUrl: z.string().default('https://api.anthropic.com'),
  }),
  gemini: z.object({
    apiKey: z.string().optional(),
  }),
  grok: z.object({
    apiKey: z.string().optional(),
  }),
})

export const appConfigSchema = z.object({
  ...baseConfig.shape,
  database: databaseConfigSchema,
  redis: redisConfigSchema,
  jwtSecret: z.string().default('crossboost-jwt-secret'),
  internalToken: z.string().default('change-this-secret-token'),
  serverUrl: z.string().default('http://localhost:3002'),
  assets: z.object({
    endpoint: z.string().default(''),
    bucket: z.string().default(''),
    accessKey: z.string().default(''),
    secretKey: z.string().default(''),
  }),
  ai: aiConfigSchema,
})

export class AppConfig extends createZodDto(appConfigSchema) {}

export const config = selectConfig(AppConfig)
