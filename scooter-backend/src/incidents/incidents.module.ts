import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './entities/incident.entity';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { IncidentsGateway } from './incidents.gateway';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [TypeOrmModule.forFeature([Incident]), GeocodingModule],
  controllers: [IncidentsController],
  providers: [IncidentsService, IncidentsGateway],
  exports: [IncidentsService, IncidentsGateway],
})
export class IncidentsModule {}
