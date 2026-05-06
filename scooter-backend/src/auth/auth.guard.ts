import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Lütfen önce giriş yapın (Token bulunamadı)');
    }

    try {
      // Token çözme
      const payload = await this.jwtService.verifyAsync(token, {
        secret: '123', 
      });

      console.log(' AuthGuard Decode Başarılı');
      console.log('Payload İçeriği:', payload); 

      // RolesGuard okuyabilsin diye payload attık.
      request['user'] = payload;
      
    } catch (error) {
      console.error(' AuthGuard Hatası ', error.message);
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş anahtar');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}