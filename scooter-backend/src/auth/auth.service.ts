import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}


  async register(userDto: any): Promise<any> {
    // Kullanıcı adı daha önceden alındı mı?
    const userExists = await this.usersService.findOneByUsername(userDto.username);
    if (userExists) {
      throw new BadRequestException('Bu kullanıcı adı zaten alınmış.');
    }

    // Hash işlemi
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userDto.password, salt);

    // Kullanıcıyı oluştur ve kaydet (Rolü frontend'den gelen değerle beraber saklar)
    return this.usersService.create({
      ...userDto,
      password: hashedPassword,
    });
  }

  
  async signIn(username: string, pass: string, requestedRole: string = 'User'): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    
    // Kullanıcı var mı?
    if (!user) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya hatalı şifre');
    }

    // Bcrypt ile şifre karşılaştırmak için
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Hatalı kullanıcı adı veya şifre');
    }

    // GÜVENLİK: User tarafından istenirse otomatik User role'ü ver
    let finalRole = user.role;
    
    if (requestedRole === 'User') {
      // User girişi: Her zaman User role'ü ile gir 
      finalRole = 'User';
    } else if (requestedRole === 'Operator') {
      // Operatör girişi: Kullanıcının role'ü Operator ise izin ver
      if (user.role !== 'Operator') {
        throw new UnauthorizedException('Bu hesap operatör yetkisine sahip değil.');
      }
      finalRole = 'Operator';
    }

    // JWT Token oluşturma rol bilgisi ile
    const payload = { sub: user.id, username: user.username, role: finalRole };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}