import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '@/config/database.config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtlSec: number;
  private readonly refreshTtlSec: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessSecret = this.config.get<string>('JWT_ACCESS_SECRET') ?? 'dev-access-secret';
    this.refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') ?? 'dev-refresh-secret';
    this.accessTtlSec = Number.parseInt(
      this.config.get<string>('JWT_ACCESS_EXPIRES_SEC') ?? '900',
      10,
    );
    this.refreshTtlSec = Number.parseInt(
      this.config.get<string>('JWT_REFRESH_EXPIRES_SEC') ?? '604800',
      10,
    );
  }

  async register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const slugTaken = await this.prisma.organization.findUnique({
      where: { slug: dto.organizationSlug },
    });
    if (slugTaken) {
      throw new ConflictException('Organization slug already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const org = await this.prisma.organization.create({
      data: {
        name: dto.organizationName,
        slug: dto.organizationSlug,
        plan: 'FREE_TRIAL',
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.OWNER,
        organizationId: org.id,
      },
    });

    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token revoked');
    }
    const matches = await bcrypt.compare(
      this.hashRefreshToken(refreshToken),
      user.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret: this.accessSecret,
      expiresIn: this.accessTtlSec,
    });

    const refreshToken = await this.jwtService.signAsync(
      { ...jwtPayload, jti: randomBytes(16).toString('hex') },
      { secret: this.refreshSecret, expiresIn: this.refreshTtlSec },
    );

    const refreshTokenHash = await bcrypt.hash(this.hashRefreshToken(refreshToken), 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSec,
    };
  }

  validateAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, { secret: this.accessSecret });
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
