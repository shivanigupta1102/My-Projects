import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'owner@shop.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'My Shop' })
  @IsString()
  @MinLength(2)
  organizationName!: string;

  @ApiProperty({ example: 'my-shop' })
  @IsString()
  @MinLength(2)
  organizationSlug!: string;
}
