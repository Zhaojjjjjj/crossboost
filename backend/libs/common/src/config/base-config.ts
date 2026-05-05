import { z } from 'zod'

export const baseConfig = z.object({
  port: z.number().default(3000),
  env: z.enum(['development', 'production', 'test']).default('development'),
})

export function selectConfig<T>(schema: z.ZodType<T>): T {
  return schema.parse({
    port: Number(process.env.PORT) || undefined,
    env: process.env.NODE_ENV || 'development',
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
