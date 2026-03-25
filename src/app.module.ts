import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { AppConfigModule } from './config/config.module.js'
import { AuthModule } from './auth/auth.module.js'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js'
import { HealthModule } from './health/health.module.js'
import { MastraModule } from './mastra/mastra.module.js'
import { ChatModule } from './chat/chat.module.js'
import { IngestModule } from './ingest/ingest.module.js'

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('throttle.ttl', 60000),
            limit: configService.get<number>('throttle.limit', 20),
          },
        ],
      }),
    }),
    AuthModule,
    HealthModule,
    MastraModule,
    ChatModule,
    IngestModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
