import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { GeocodingService } from '../geocoding/geocoding.service';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentsRepository: Repository<Incident>,
    private geocodingService: GeocodingService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    // Eğer adres sağlanmadıysa, ters coğrafi kodlama yap
    let address = createIncidentDto.address;
    if (!address) {
      address = await this.geocodingService.reverseGeocode(
        createIncidentDto.lat,
        createIncidentDto.lon,
      );
    }

    const incident = this.incidentsRepository.create({
      ...createIncidentDto,
      address: address || undefined,
    });
    return this.incidentsRepository.save(incident);
  }

  async findAll(): Promise<Incident[]> {
    return this.incidentsRepository.find({
      where: { isResolved: false },
      order: { createdAt: 'DESC' },
      relations: ['reportedByUser'],
    });
  }

  async findOne(id: number): Promise<Incident> {
    const incident = await this.incidentsRepository.findOne({
      where: { id },
      relations: ['reportedByUser'],
    });
    if (!incident) {
      throw new NotFoundException(`ID: ${id} olan olay bulunamadı`);
    }
    return incident;
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);
    Object.assign(incident, updateIncidentDto);
    return this.incidentsRepository.save(incident);
  }

  async remove(id: number): Promise<Incident> {
    const incident = await this.findOne(id);
    return this.incidentsRepository.remove(incident);
  }

  async incrementReportCount(id: number): Promise<Incident> {
    const incident = await this.findOne(id);
    incident.report_count += 1;
    return this.incidentsRepository.save(incident);
  }

  async resolveIncident(id: number): Promise<Incident> {
    const incident = await this.findOne(id);
    incident.isResolved = true;
    return this.incidentsRepository.save(incident);
  }

  async findNearby(lat: number, lon: number, radiusKm: number = 10): Promise<Incident[]> {
    // Haversine formülü ile mesafe hesapla (km cinsinden)
    const query = this.incidentsRepository
      .createQueryBuilder('incident')
      .where(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(incident.lat)) * cos(radians(incident.lon) - radians(:lon)) + sin(radians(:lat)) * sin(radians(incident.lat)))) <= :radius`,
        {
          lat,
          lon,
          radius: radiusKm,
        },
      )
      .andWhere('incident.isResolved = false')
      .orderBy('incident.createdAt', 'DESC')
      .setParameters({ lat, lon, radius: radiusKm });

    return query.getMany();
  }
}
