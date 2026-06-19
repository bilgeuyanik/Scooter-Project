import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Scooter } from './scooters/entities/scooter.entity';

@Entity()
export class Ride {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User; 

  @ManyToOne(() => Scooter)
  scooter: Scooter; 

  @CreateDateColumn()
  startTime: Date; 

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date; 

  @Column({ default: 'ongoing' }) 
  status: string;

  @Column({ type: 'float', nullable: true })
  totalPrice: number; 
}