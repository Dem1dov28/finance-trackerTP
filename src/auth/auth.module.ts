import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        // Получаем значение как строку (не преобразуя в число)
        const expiresIn = config.get('JWT_ACCESS_EXPIRES_IN', '15m');
        const secret = config.getOrThrow<string>('JWT_SECRET');

        console.log(`JWT Config - RAW: ${config.get('JWT_ACCESS_EXPIRES_IN')}`); // Добавьте это
        console.log(`JWT Config - FINAL: ${expiresIn}`);

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtModule, PassportModule, JwtAuthGuard],
})
export class AuthModule {}
