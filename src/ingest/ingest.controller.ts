import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { IngestService } from './ingest.service.js'
import { IngestRequestDto } from './dto/ingest-request.dto.js'
import { UploadRequestDto } from './dto/upload-request.dto.js'
import { ApiResponseDto } from '../common/dto/api-response.dto.js'
import { IngestResponseDto } from './dto/ingest-response.dto.js'

const ALLOWED_MIMETYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post()
  async ingest(
    @Body() dto: IngestRequestDto,
  ): Promise<ApiResponseDto<IngestResponseDto>> {
    const result = await this.ingestService.ingestDocument(dto)
    return ApiResponseDto.ok(result)
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadRequestDto,
  ): Promise<ApiResponseDto<IngestResponseDto>> {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIMETYPES.join(', ')}`,
      )
    }

    const result = await this.ingestService.ingestUploadedFile(file, dto)
    return ApiResponseDto.ok(result)
  }
}
