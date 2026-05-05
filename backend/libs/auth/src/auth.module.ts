import { Module, Global } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'

export interface AuthConfig {
  jwtSecret: string
  jwtExpiresIn?: string
  apiKeyHeader?: string
  apiKeys?: string[]
}

@Global()
@Module({})
export class AuthModule {
  static forRoot(config: AuthConfig) {
    return {
      module: AuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
          secret: config.jwtSecret,
          signOptions: { expiresIn: config.jwtExpiresIn || '7d' },
        }),
      ],
      providers: [
        AuthService,
        JwtStrategy,
        { provide: 'AUTH_CONFIG', useValue: config },
      ],
      exports: [AuthService, JwtModule],
    }
  }
}
