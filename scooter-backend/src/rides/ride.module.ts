import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RideService } from './ride.service';
import { RideController } from './ride.controller';
import { Ride } from './ride.entity';
import { Scooter } from '../scooters/entities/scooter.entity';
import { User } from '../users/entities/user.entity';
import { ScootersModule } from '../scooters/scooters.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ride, Scooter, User]), ScootersModule],
  providers: [RideService],
  controllers: [RideController],
})
export class RideModule {}