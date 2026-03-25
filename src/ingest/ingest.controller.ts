import { Body, Controller, Post } from '@nestjs/common'
import { IngestService } from './ingest.service.js'
import { IngestRequestDto } from './dto/ingest-request.dto.js'
import { ApiResponseDto } from '../common/dto/api-response.dto.js'
import { IngestResponseDto } from './dto/ingest-response.dto.js'

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
}
