import { z } from 'zod'

export const baseConfig = z.object({
  port: z.number().default(3000),
  env: z.enum(['development', 'production', 'test']).default('development'),
})

export function selectConfig<T>(schema: z.ZodType<T>): T {
  return schema.parse({
    port: Number(process.env.PORT) || undefined,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET,
    internalToken: process.env.INTERNAL_TOKEN,
    serverUrl: process.env.SERVER_URL,
    aiServiceUrl: process.env.AI_SERVICE_URL,
    database: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    },
    redis: {
      url: process.env.REDIS_URL,
    },
    assets: {
      endpoint: process.env.ASSETS_ENDPOINT,
      bucket: process.env.ASSETS_BUCKET,
      accessKey: process.env.ASSETS_ACCESS_KEY,
      secretKey: process.env.ASSETS_SECRET_KEY,
    },
    ai: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
      },
      grok: {
        apiKey: process.env.GROK_API_KEY,
      },
    },
  })
}

export function createZodDto(schema: z.ZodType, name?: string) {
  // Creates a class from zod schema for NestJS DI
  class Dto {
    static _schema = schema
    static _name = name || 'Dto'
  }
  return Dto as any
}
