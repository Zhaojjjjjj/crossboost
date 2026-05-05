import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { IS_PUBLIC_KEY } from './auth.decorator'
import type { AuthConfig } from './auth.module'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    @Inject('AUTH_CONFIG') private readonly config: AuthConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header')
    }

    // Try JWT Bearer token first
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      try {
        const payload = this.jwtService.verify(token)
        request.user = payload
        return true
      } catch {
        throw new UnauthorizedException('Invalid or expired token')
      }
    }

    // Try API Key
    const apiKeyHeader = this.config.apiKeyHeader || 'x-api-key'
    const apiKey = request.headers[apiKeyHeader.toLowerCase()]
    if (apiKey && this.config.apiKeys?.includes(apiKey)) {
      request.user = { type: 'api-key' }
      return true
    }

    throw new UnauthorizedException('Invalid authentication')
  }
}
