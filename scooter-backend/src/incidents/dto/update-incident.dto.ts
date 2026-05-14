import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateIncidentDto } from './create-incident.dto';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @IsOptional()
  @IsString()
  operatorNotes?: string;

  @IsOptional()
  @IsString()
  briefExplanation?: string;
}
