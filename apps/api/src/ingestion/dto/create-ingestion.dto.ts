import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateIngestionDto {
  @ApiPropertyOptional({ description: 'Label for this ingestion batch' })
  @IsOptional()
  @IsString()
  sourceLabel?: string;
}
