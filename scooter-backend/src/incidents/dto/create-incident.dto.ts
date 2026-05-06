import { IsNumber, IsEnum, IsOptional, IsString } from 'class-validator';
import { IncidentType } from '../entities/incident.entity';

export class CreateIncidentDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;

  @IsEnum(IncidentType)
  type: IncidentType;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsNumber()
  reportedByUserId?: number;
}
