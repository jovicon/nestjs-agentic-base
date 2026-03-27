import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { LoginRequestDto } from './dto/login-request.dto.js'
import { TokenResponseDto } from './dto/token-response.dto.js'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginRequestDto): Promise<TokenResponseDto> {
    // TODO: Replace with real user validation (e.g., against DB or external IdP)
    // This is a placeholder for development/testing
    const user = this.validateUser(dto.username, dto.password)

    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    }

    const expiresIn = 3600 // 1 hour

    const accessToken = this.jwtService.sign(payload, { expiresIn })

    return {
      accessToken,
      expiresIn,
      tokenType: 'Bearer',
    }
  }

  private validateUser(username: string, password: string) {
    // TODO: Implement real authentication logic
    // For now, accept any non-empty credentials for testing
    if (!username || !password) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return {
      id: `user-${username}`,
      email: `${username}@vra.cl`,
      roles: ['ejecutivo'],
    }
  }
}
