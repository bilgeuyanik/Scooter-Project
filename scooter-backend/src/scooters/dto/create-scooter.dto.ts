import { IsString, IsNumber, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateScooterDto {
  @IsString({ message: 'Scooter adı metin olmalıdır' })
  @IsNotEmpty({ message: 'Scooter adı boş bırakılamaz' })
  unique_name: string;

  @IsNumber({}, { message: 'Batarya bir sayı olmalıdır' })
  @Min(0, { message: 'Batarya en az 0 olabilir' })
  @Max(100, { message: 'Batarya en fazla 100 olabilir' })
  battery_status: number;

  @IsNumber({}, { message: 'Enlem (latitude) bir sayı olmalıdır' })
  latitude: number;

  @IsNumber({}, { message: 'Boylam (longitude) bir sayı olmalıdır' })
  longitude: number;
}