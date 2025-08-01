import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RequestWithUser } from './interfaces/request-with-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    const result = await this.authService.register(registerDto, res);
    return res.status(HttpStatus.CREATED).json(result);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const result = await this.authService.login(loginDto, res);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('refresh')
  async refreshTokens(@Req() req: RequestWithUser, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ message: 'Refresh token not provided' });
    }

    const result = await this.authService.refreshTokens(refreshToken, res);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Access token not provided' });
    }

    const result = await this.authService.logout(req.user.id, accessToken, res);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: RequestWithUser) {
    return {
      id: req.user.id,
      email: req.user.email,
    };
  }
}
