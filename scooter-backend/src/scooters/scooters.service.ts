import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Repository } from 'typeorm'; 
import { Scooter } from './entities/scooter.entity'; 
import { CreateScooterDto } from './dto/create-scooter.dto';
import { UpdateScooterDto } from './dto/update-scooter.dto';

@Injectable()
export class ScootersService {
  constructor(
    @InjectRepository(Scooter) 
    private scootersRepository: Repository<Scooter>, 
  ) {}

  create(createScooterDto: CreateScooterDto) {
    const newScooter = this.scootersRepository.create(createScooterDto);
    return this.scootersRepository.save(newScooter);
  }

  async findAll(lat?: number, lng?: number, radius: number = 500, userRole?: string) {
  
  if (!lat || !lng) {
    let scooters = await this.scootersRepository.find();
    
    // User rolü ise %20'den az bataryalı scooterları filtrele
    if (userRole === 'User') {
      scooters = scooters.filter(s => s.battery_status >= 20 && s.status === 'available');
    }
    return scooters;
  }

  // Koordinatlar gelirse QueryBuilder ile mesafe hesabı
  let query = this.scootersRepository
    .createQueryBuilder('scooter')
    .where(
      '(6371 * acos(cos(radians(:lat)) * cos(radians(scooter.latitude)) * cos(radians(scooter.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(scooter.latitude)))) * 1000 <= :radius',
      { lat, lng, radius }
    );
  
  // User rolü ise %20'den az bataryalı scooterları filtrele
  if (userRole === 'User') {
    query = query
      .andWhere('scooter.battery_status >= :minBattery', { minBattery: 20 })
      .andWhere('scooter.status = :status', { status: 'available' });
  }
  
  const scooters = await query.getMany();
  return scooters;
}

  async findOne(id: number): Promise<Scooter> {
  const scooter = await this.scootersRepository.findOneBy({ id });
  if (!scooter) {
    throw new NotFoundException(`${id} numaralı scooter bulunamadı.`);
  }
  return scooter;
}

async update(id: number, updateScooterDto: UpdateScooterDto) {
  
  await this.findOne(id);

  await this.scootersRepository.update(id, updateScooterDto);

  return this.findOne(id);
}

  async remove(id: number) {
    const scooter = await this.findOne(id);
    return this.scootersRepository.remove(scooter);
  }
}
