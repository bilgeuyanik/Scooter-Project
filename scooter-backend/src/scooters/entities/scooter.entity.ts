import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('scooters')
export class Scooter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('float')
  latitude!: number;

  @Column('float')
  longitude!: number;

  @Column()
  unique_name!: string;

  @Column('int')
  battery_status!: number;

  @Column({ default: 'available' }) 
  status: string;
}