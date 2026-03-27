import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './strategies/jwt.strategy.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          issuer: configService.get<string>('auth.jwtIssuer'),
          audience: configService.get<string>('auth.jwtAudience'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AuthService],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
