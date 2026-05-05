import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { z } from 'zod'

export const databaseConfigSchema = z.object({
  host: z.string(),
  port: z.number().default(3306),
  username: z.string(),
  password: z.string(),
  database: z.string(),
})

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(config: DatabaseConfig) {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          autoLoadEntities: true,
          synchronize: true, // TODO: disable in production, use migrations
          charset: 'utf8mb4',
          logging: process.env.NODE_ENV === 'development',
        }),
      ],
    }
  }
}
