import { PartialType } from '@nestjs/mapped-types';
import { CreateScooterDto } from './create-scooter.dto';

export class UpdateScooterDto extends PartialType(CreateScooterDto) {}