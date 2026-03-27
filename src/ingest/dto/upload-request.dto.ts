import { IsNumber, IsOptional, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class UploadRequestDto {
  @IsOptional()
  @IsString()
  chunkStrategy?: 'recursive' | 'markdown' | 'sentence'

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chunkSize?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  chunkOverlap?: number
}
