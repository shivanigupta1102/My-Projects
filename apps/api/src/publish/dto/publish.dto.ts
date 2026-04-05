import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Channel } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class PublishDto {
  @ApiProperty()
  @IsUUID()
  listingPackageId!: string;

  @ApiProperty({ enum: Channel })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  channelAccountId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
