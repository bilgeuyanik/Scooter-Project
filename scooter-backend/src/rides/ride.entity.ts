import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../users/entities/user.entity'; 
import { Scooter } from '../scooters/entities/scooter.entity'; 

@Entity('rides')
export class Ride {
  @PrimaryGeneratedColumn()
  id: number;

  //Kullanıcı İlişkisi ve Sütunu
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' }) 
  user: User;

  @Column({ nullable: true })
  userId: number;

  //Scooter İlişkisi ve Sütunu
  @ManyToOne(() => Scooter)
  @JoinColumn({ name: 'scooterId' })
  scooter: Scooter;

  @Column({ nullable: true })
  scooterId: number;

  @CreateDateColumn({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ default: 'ongoing' })
  status: string;

  @Column({ name: 'totalPrice', type: 'double precision', nullable: true, default: 0 })
  totalPrice: number;
}