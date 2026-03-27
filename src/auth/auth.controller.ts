import { Body, Controller, Post } from '@nestjs/common'
import { Public } from '../common/decorators/public.decorator.js'
import { AuthService } from './auth.service.js'
import { LoginRequestDto } from './dto/login-request.dto.js'
import { ApiResponseDto } from '../common/dto/api-response.dto.js'
import { TokenResponseDto } from './dto/token-response.dto.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginRequestDto): Promise<ApiResponseDto<TokenResponseDto>> {
    const result = await this.authService.login(dto)
    return ApiResponseDto.ok(result)
  }
}
