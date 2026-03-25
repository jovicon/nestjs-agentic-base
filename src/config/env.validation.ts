import { plainToInstance } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsOptional, IsString, validateSync } from 'class-validator'

class EnvironmentVariables {
  @IsNumber()
  @IsOptional()
  PORT?: number

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string

  @IsString()
  @IsNotEmpty()
  MONGODB_URI: string

  @IsString()
  @IsNotEmpty()
  ANTHROPIC_API_KEY: string

  @IsString()
  @IsOptional()
  GCS_BUCKET_NAME?: string

  @IsString()
  @IsOptional()
  GCS_PROJECT_ID?: string
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  })
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  })

  if (errors.length > 0) {
    throw new Error(errors.toString())
  }
  return validatedConfig
}
