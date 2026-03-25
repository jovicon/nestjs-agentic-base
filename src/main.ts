import { NestFactory } from '@nestjs/core'
import { Logger, ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import compression from 'compression'
import { AppModule } from './app.module.js'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // Global prefix: all routes under /agent/*
  app.setGlobalPrefix('agent')

  // Security
  app.use(helmet())
  app.use(compression())

  // CORS for VRA BFF
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

  // Global filters and interceptors
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())

  const port = process.env.PORT ?? 8080
  await app.listen(port, '0.0.0.0')
  logger.log(`ventaagent-ms running on port ${port}`)
}

bootstrap()
