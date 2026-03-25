import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string

  @IsOptional()
  @IsString()
  threadId?: string

  @IsOptional()
  @IsString()
  resourceId?: string
}
