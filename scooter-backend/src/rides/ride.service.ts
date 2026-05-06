import { Injectable, BadRequestException } from '@nestjs/common'; 
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ride } from './ride.entity';
import { Scooter } from '../scooters/entities/scooter.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Ride)
    private rideRepository: Repository<Ride>,
    @InjectRepository(Scooter)
    private scooterRepository: Repository<Scooter>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async startRide(scooterId: number, userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new BadRequestException('Kullanıcı bulunamadı');

    const minBalanceRequired = 20; 
    if (user.balance < minBalanceRequired) {
      throw new BadRequestException(`Yetersiz bakiye!`);
    }

    const scooter = await this.scooterRepository.findOneBy({ id: scooterId });
    if (!scooter) throw new BadRequestException('Scooter bulunamadı');
    if (scooter.status !== 'available') throw new BadRequestException('Scooter kullanımda');

    await this.scooterRepository.update(scooterId, { status: 'in_use' });

    // newRide oluştururken 'scooter' objesini doğrudan bağla
    const newRide = this.rideRepository.create({
      status: 'ongoing',
      totalPrice: 0,
      startTime: new Date(),
      userId: userId, 
      scooterId: scooterId,
      scooter: scooter 
    });

    await this.rideRepository.save(newRide);
    return newRide;
}

  // lastBattery parametresini ekle.
  async endRide(rideId: number, lastBattery?: number) {
    const ride = await this.rideRepository.findOne({ 
      where: { id: rideId },
      relations: ['scooter', 'user'] 
    });

    if (!ride) throw new BadRequestException('Sürüş kaydı bulunamadı');

    const endTime = new Date();
    const startTime = ride.startTime;
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    const pricePerMinute = 2;
    const calculatedTotal = Math.ceil(diffMinutes * pricePerMinute);

    let updatedBalance = 0;

    if (ride.user) {
      updatedBalance = (ride.user.balance || 0) - calculatedTotal;
      await this.userRepository.update(ride.user.id, { balance: updatedBalance });
    }

    
    await this.rideRepository.update(rideId, {
      endTime: endTime,
      status: 'finished',
      totalPrice: calculatedTotal
    });

    
    let updatedScooter: any = null;
    if (ride.scooter) {
      const updateData: any = { status: 'available' };
      
      // frontend'den bir batarya değeri gelmişse onu da kaydet
      if (lastBattery !== undefined && lastBattery !== null) {
        updateData.battery_status = lastBattery;
      }

      await this.scooterRepository.update(ride.scooter.id, updateData);
      updatedScooter = await this.scooterRepository.findOneBy({ id: ride.scooter.id });
    }

    return {
      message: 'Sürüş tamamlandı',
      duration: diffMinutes,
      totalPrice: calculatedTotal,
      remainingBalance: ride.user ? updatedBalance : 0,
      scooter: updatedScooter
    };
  }

  async getMyRides(userId: number) {
    return this.rideRepository.find({
      where: { userId: userId },
      order: { startTime: 'DESC' },
      relations: ['scooter']
    });
  }
}