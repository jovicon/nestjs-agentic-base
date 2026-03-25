import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class IngestRequestDto {
  @IsString()
  @IsNotEmpty()
  bucketName: string

  @IsString()
  @IsNotEmpty()
  fileName: string

  @IsOptional()
  @IsString()
  chunkStrategy?: 'recursive' | 'markdown' | 'sentence'

  @IsOptional()
  @IsNumber()
  chunkSize?: number

  @IsOptional()
  @IsNumber()
  chunkOverlap?: number
}
