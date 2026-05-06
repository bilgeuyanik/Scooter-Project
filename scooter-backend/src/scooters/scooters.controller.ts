import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common'; 
import { ScootersService } from './scooters.service';
import { CreateScooterDto } from './dto/create-scooter.dto';
import { UpdateScooterDto } from './dto/update-scooter.dto';
import { AuthGuard } from '../auth/auth.guard'; 
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator'; 

@Controller('scooters')
export class ScootersController {
  constructor(private readonly scootersService: ScootersService) {}

  // Sadece operatörler scooter eklesin.
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Operator') 
  @Post()
  create(@Body() createScooterDto: CreateScooterDto) {
    return this.scootersService.create(createScooterDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll(
    @Request() req: any,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    const userRole = req.user?.role || 'User';
    return this.scootersService.findAll(
      lat ? +lat : undefined,
      lng ? +lng : undefined,
      radius ? +radius : 500,
      userRole
    );
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scootersService.findOne(+id);
  }

  //Güncellemeler de yetki ile
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Operator')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateScooterDto: UpdateScooterDto) {
    return this.scootersService.update(+id, updateScooterDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('Operator') 
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scootersService.remove(+id);
  }
}