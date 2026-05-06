import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';

@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('reverse')
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
  ) {
    if (!lat || !lon) {
      throw new BadRequestException('lat ve lon parametreleri zorunludur');
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException('lat ve lon geçerli sayılar olmalıdır');
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new BadRequestException('Geçersiz koordinatlar');
    }

    try {
      const address = await this.geocodingService.reverseGeocode(latitude, longitude);
      return {
        success: true,
        address: address || 'Adres belirlenemedi',
        lat: latitude,
        lon: longitude,
      };
    } catch (error) {
      throw new BadRequestException('Adres getirilemedi: ' + error.message);
    }
  }
}
