import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestUser } from './interfaces/request-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new organization and owner user' })
  @ApiResponse({ status: 201 })
  async register(@Body() dto: RegisterDto) {
    const { user, tokens } = await this.auth.register(dto);
    return {
      success: true,
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role,
        tokens,
      },
    };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200 })
  async login(@Body() dto: LoginDto) {
    const { user, tokens } = await this.auth.login(dto);
    return {
      success: true,
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role,
        tokens,
      },
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Rotate tokens using refresh token' })
  @ApiResponse({ status: 200 })
  async refresh(@Body() dto: RefreshDto) {
    const tokens = await this.auth.refresh(dto.refreshToken);
    return { success: true, data: { tokens } };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Invalidate refresh token for current user' })
  @ApiResponse({ status: 200 })
  async logout(@CurrentUser() user: RequestUser) {
    await this.auth.logout(user.userId);
    return { success: true, data: { ok: true } };
  }
}
