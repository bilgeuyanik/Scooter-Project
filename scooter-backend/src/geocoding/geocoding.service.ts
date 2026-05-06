import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  /**
   * Nominatim API kullanarak lat/lon'u adrese dönüştür
   * @param lat Enlem
   * @param lon Boylan
   * @returns Adres metni
   */
  async reverseGeocode(lat: number, lon: number): Promise<string | undefined> {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse`,
        {
          params: {
            format: 'json',
            lat,
            lon,
            zoom: 18,
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'Scooter-App/1.0',
          },
          timeout: 5000,
        }
      );

      const address = response.data?.address;
      if (!address) {
        return undefined;
      }

      // Detaylı adres formatı: Bina No., Cadde/Sokak, Mahalle, Şehir, Ülke
      const parts: string[] = [];

      // Bina numarası + Cadde/Sokak
      if (address.house_number && address.road) {
        parts.push(`No: ${address.house_number} ${address.road}`);
      } else if (address.road) {
        parts.push(address.road);
      }

      // Mahalle/Bölge
      if (address.neighbourhood) {
        parts.push(address.neighbourhood);
      } else if (address.suburb) {
        parts.push(address.suburb);
      }

      // İlçe (ilçe varsa ekle)
      if (address.county) {
        parts.push(address.county);
      }

      // Şehir/İl
      if (address.city) {
        parts.push(address.city);
      } else if (address.town) {
        parts.push(address.town);
      } else if (address.village) {
        parts.push(address.village);
      }

      // Ülke
      if (address.country) {
        parts.push(address.country);
      }

      const formattedAddress = parts.join(', ');
      this.logger.log(
        `✅ Ters coğrafi kodlama: (${lat}, ${lon}) -> ${formattedAddress}`
      );

      return formattedAddress;
    } catch (error) {
      this.logger.error(
        `❌ Ters coğrafi kodlama hatası: ${error.message}`,
        error.stack
      );
      return undefined;
    }
  }
}
