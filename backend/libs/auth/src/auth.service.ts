import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

export interface JwtPayload {
  sub: string
  email?: string
  role?: string
  [key: string]: any
}

export interface TokenResult {
  accessToken: string
  expiresIn: string
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  generateToken(payload: JwtPayload): TokenResult {
    const accessToken = this.jwtService.sign(payload)
    return { accessToken, expiresIn: '7d' }
  }

  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token)
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return this.jwtService.decode(token) as JwtPayload
    } catch {
      return null
    }
  }
}
