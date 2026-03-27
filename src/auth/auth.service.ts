import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { LoginRequestDto } from './dto/login-request.dto.js'
import { TokenResponseDto } from './dto/token-response.dto.js'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginRequestDto): Promise<TokenResponseDto> {
    const user = this.validateUser(dto)

    const payload = {
      nombre: user.nombre,
      email: user.email,
      rut: user.rut,
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

  private validateUser(dto: LoginRequestDto) {
    if (!dto.username || !dto.password || !dto.rut) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return {
      nombre: `${dto.username}`,
      rut: `${dto.rut}`,
      email: `${dto.username}@vra.cl`,
      roles: ['ejecutivo'],
    }
  }
}
