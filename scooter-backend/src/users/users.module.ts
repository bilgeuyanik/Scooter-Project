import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // "UserRepository"yi bu modül için aktif ettik.
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // AuthService kullanıcak.
})
export class UsersModule {}
