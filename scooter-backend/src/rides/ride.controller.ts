import { Controller, Post, Body, UseGuards, Request, Patch, Param, Get, Inject } from '@nestjs/common';
import { RideService } from './ride.service';
import { AuthGuard } from '../auth/auth.guard';
import { ScootersGateway } from '../scooters/scooters.gateway'; 

@Controller('rides')
export class RideController {
  constructor(
    private readonly rideService: RideService,
    private readonly scootersGateway: ScootersGateway
  ) {}

  @UseGuards(AuthGuard) 
  @Post('start')
  async start(
    @Body('scooterId') scooterId: number, 
    @Body('userId') userId: number 
  ) {
    return this.rideService.startRide(scooterId, userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/end')
  async endRide(
    @Param('id') id: string,
    @Body('lastBattery') lastBattery: number 
  ) {
    // Servis metoduna hem ID'yi hem de gelen batarya bilgisini gönder.
    const result = await this.rideService.endRide(Number(id), lastBattery);
    
    // Güncellenmiş scooter'ı tüm clientlara broadcast et
    if (result.scooter) {
      console.log('🔋 Sürüş bitti, scooter güncelleniyor:', result.scooter);
      this.scootersGateway.server.emit('scooter:updated', result.scooter);
      console.log('📡 WebSocket emit gönderildi');
    } else {
      console.log('⚠️ result.scooter bulunamadı');
    }
    
    return result;
  }

  @UseGuards(AuthGuard)
  @Get('my-rides/:userId')
  async getMyRides(@Param('userId') userId: string) {
    return this.rideService.getMyRides(Number(userId));
  }
}