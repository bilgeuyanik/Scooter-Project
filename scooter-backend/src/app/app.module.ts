import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Scooter } from '../scooters/entities/scooter.entity';
import { Ride } from '../rides/ride.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { UsersModule } from '../users/users.module'; 
import { AuthModule } from '../auth/auth.module';   
import { ScootersModule } from '../scooters/scooters.module';
import { RideModule } from '../rides/ride.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'bilge123',
      database: 'scooter_db',
      entities: [User, Scooter, Ride, Incident],
      synchronize: true,
    }),
    UsersModule, 
    AuthModule, 
    ScootersModule, 
    RideModule,
    IncidentsModule,
    GeocodingModule,
    AiAnalysisModule,
  ],
})
export class AppModule {}