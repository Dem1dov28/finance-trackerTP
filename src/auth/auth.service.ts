import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';
import { LoginDto } from 'src/auth/dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';

interface TokenPayload {
  sub: string;
  email: string;
  tokenVersion: number;
  jti: string;
}

@Injectable()
export class AuthService {
  private readonly tokenBlacklist = new Set<string>();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, response: Response) {
    const { email, password, name } = dto;

    const existUser = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (existUser) {
      throw new ConflictException('Пользователь с такой почтой уже существует');
    }

    const user = await this.prismaService.user.create({
      data: {
        name,
        email,
        password: await hash(password),
        refreshTokenVersion: 0,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, 0);
    this.setRefreshTokenCookie(response, tokens.refresh_token);

    return {
      message: 'Регистрация успешна',
      access_token: tokens.access_token,
    };
  }

  async login(dto: LoginDto, response: Response) {
    const { email, password } = dto;

    const user = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.refreshTokenVersion,
    );
    this.setRefreshTokenCookie(response, tokens.refresh_token);

    return {
      message: 'Вход выполнен успешно',
      access_token: tokens.access_token,
    };
  }

  async refreshTokens(refreshToken: string, response: Response) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as TokenPayload;

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshTokenVersion !== payload.tokenVersion) {
        throw new ForbiddenException('Токен отозван');
      }

      const newTokens = await this.generateTokens(
        user.id,
        user.email,
        user.refreshTokenVersion,
      );
      this.setRefreshTokenCookie(response, newTokens.refresh_token);

      return {
        access_token: newTokens.access_token,
      };
    } catch (e) {
      throw new UnauthorizedException('Невалидный refresh-токен');
    }
  }

  async logout(userId: string, accessToken: string, response: Response) {
    await this.prismaService.user.update({
      where: { id: userId },
      data: { refreshTokenVersion: { increment: 1 } },
    });

    this.tokenBlacklist.add(accessToken);

    this.clearRefreshTokenCookie(response);
    return { message: 'Выход выполнен успешно' };
  }

  async validateAccessToken(token: string): Promise<boolean> {
    if (this.tokenBlacklist.has(token)) {
      return false;
    }

    try {
      this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      return true;
    } catch {
      return false;
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    tokenVersion: number,
  ) {
    const payload: TokenPayload = {
      sub: userId,
      email,
      tokenVersion,
      jti: randomBytes(16).toString('hex'),
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const expiresInMs = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN_MS',
    );

    if (!expiresInMs) {
      throw new Error('JWT_REFRESH_EXPIRES_IN_MS is not configured');
    }

    const maxAge = parseInt(expiresInMs, 10);
    if (isNaN(maxAge)) {
      throw new Error('JWT_REFRESH_EXPIRES_IN_MS must be a valid number');
    }

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge,
      domain: this.configService.get<string>('COOKIE_DOMAIN'),
      path: '/auth/refresh',
    });
  }

  private clearRefreshTokenCookie(response: Response) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    response.clearCookie('refresh_token', {
      domain: this.configService.get<string>('COOKIE_DOMAIN'),
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/auth/refresh',
    });
  }
}
