import { z } from 'zod'
import { selectConfig } from '@crossboost/common'

const configSchema = z.object({
  PORT: z.coerce.number().default(3010),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROK_API_KEY: z.string().optional(),
  VOLCENGINE_ACCESS_KEY: z.string().optional(),
  VOLCENGINE_SECRET_KEY: z.string().optional(),
})

export type AppConfig = z.infer<typeof configSchema>

export const config = selectConfig(configSchema)
