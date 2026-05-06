import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './users/entities/user.entity';
import { Scooter } from './scooters/entities/scooter.entity';

@Entity()
export class Ride {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User; // Sürüşü yapan kişi

  @ManyToOne(() => Scooter)
  scooter: Scooter; // Kullanılan araç

  @CreateDateColumn()
  startTime: Date; // Başlangıç zamanı (otomatik oluşur)

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date; // Bitiş zamanı

  @Column({ default: 'ongoing' }) // Durum: devam ediyor veya bitti
  status: string;

  @Column({ type: 'float', nullable: true })
  totalPrice: number; // Ücret
}