import { Module } from '@nestjs/common';
import { ScootersService } from './scooters.service';
import { ScootersController } from './scooters.controller';
import { ScootersGateway } from './scooters.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scooter } from './entities/scooter.entity';
import { RolesGuard } from '../auth/roles.guard';
@Module({
  imports: [TypeOrmModule.forFeature([Scooter])],
  controllers: [ScootersController],
  providers: [ScootersService, RolesGuard, ScootersGateway],
  exports: [ScootersGateway],
})
export class ScootersModule {}
