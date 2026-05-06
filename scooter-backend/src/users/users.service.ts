import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'; // BadRequestException eklendi
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>, 
  ) {}

  async create(createUserDto: CreateUserDto) {
    const newUser = this.usersRepository.create({
      ...createUserDto,
    });
    return this.usersRepository.save(newUser);
  }

  findAll() {
    return this.usersRepository.find();
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOneBy({ id }); 
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  findOneByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }

  // Bakiye yükleme metodu
  async addBalance(userId: number, amount: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    
    if (!user) {
      throw new BadRequestException('Kullanıcı bulunamadı');
    }
    
    // Bakiye yükleme
    const newBalance = Number(user.balance) + amount;
    
    await this.usersRepository.update(userId, { balance: newBalance });
    
    return { 
      message: 'Bakiye başarıyla yüklendi', 
      newBalance 
    };
  }

  // Şifre değiştir
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Mevcut şifreyi kontrol et
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
      throw new BadRequestException('Mevcut şifre hatalı');
    }

    // Yeni şifreyi hash et
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Şifreyi güncelle
    await this.usersRepository.update(userId, { password: hashedPassword });

    return { message: 'Şifre başarıyla değiştirildi' };
  }

  // Telefon numarası güncelle
  async updatePhone(userId: number, phone: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Telefon numarasını güncelle
    await this.usersRepository.update(userId, { phone });

    return { message: 'Telefon numarası başarıyla güncellendi', phone };
  }

  // Avatar güncelle
  async updateAvatar(userId: number, avatarData: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Avatar'ı güncelle (base64 string olarak)
    await this.usersRepository.update(userId, { avatar: avatarData });

    return { message: 'Avatar başarıyla güncellendi', avatar: avatarData };
  }
}