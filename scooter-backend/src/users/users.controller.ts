import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // create metodu: Service içindeki şifreleme yapan metod.
    return this.usersService.create(createUserDto);
  }
  @UseGuards(AuthGuard)
  @Post('add-balance') 
  async addBalance(@Body() body: { userId: number; amount: number }) {
  return this.usersService.addBalance(body.userId, body.amount);
}

  @UseGuards(AuthGuard)
  @Patch('change-password')
  async changePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    const userId = req.user.sub;
    return this.usersService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @UseGuards(AuthGuard)
  @Patch('update-phone')
  async updatePhone(@Request() req: any, @Body() body: { phone: string }) {
    const userId = req.user.sub;
    return this.usersService.updatePhone(userId, body.phone);
  }

  @UseGuards(AuthGuard)
  @Patch('update-avatar')
  async updateAvatar(@Request() req: any, @Body() body: any) {
    const userId = req.user.sub;
    
    
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body must be an object');
    }
    
    if (!body.avatar || typeof body.avatar !== 'string') {
      throw new BadRequestException('Avatar must be a valid base64 string');
    }
    
    if (body.avatar.length > 5000000) { 
      throw new BadRequestException('Avatar size too large (max 5MB)');
    }
    
    return this.usersService.updateAvatar(userId, body.avatar);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}