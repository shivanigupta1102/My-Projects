import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExtractionMethod } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAttributeDto {
  @ApiProperty()
  @IsString()
  fieldName!: string;

  @ApiProperty()
  @IsString()
  value!: string;

  @ApiProperty({ enum: ExtractionMethod })
  @IsEnum(ExtractionMethod)
  method!: ExtractionMethod;

  @ApiProperty({ minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  normalizedValue?: string;
}
