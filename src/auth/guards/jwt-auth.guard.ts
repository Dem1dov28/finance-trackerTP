import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Добавляем базовую проверку перед вызовом родительской логики
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    console.log('Extracted token:', token);

    if (!token) {
      console.error('No token provided');
      throw new UnauthorizedException('Token not provided');
    }

    return super.canActivate(context);
  }

  private extractToken(request: Request): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return undefined;
    }
    return authHeader.split(' ')[1];
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}
