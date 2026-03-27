import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

export interface JwtPayload {
  sub: string
  email?: string
  rut?: string
  roles?: string[]
  iat?: number
  exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret')!,
      issuer: configService.get<string>('auth.jwtIssuer'),
      audience: configService.get<string>('auth.jwtAudience'),
    })
  }

  validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email, rut: payload.rut, roles: payload.roles }
  }
}
