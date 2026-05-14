import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum IncidentType {
  CRASH = 'Crash',
  SLOWDOWN = 'Slowdown',
  CONSTRUCTION = 'Construction',
  LANE_CLOSURE = 'Lane closure',
  OBJECT_ON_ROAD = 'Object on Road',
}

export enum IncidentSeverity {
  LOW = 'Düşük',
  MEDIUM = 'Orta',
  HIGH = 'Yüksek',
}

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 8 })
  lat: number;

  @Column('decimal', { precision: 11, scale: 8 })
  lon: number;

  @Column({
    type: 'enum',
    enum: IncidentType,
    default: IncidentType.CRASH,
  })
  type: IncidentType;

  @Column({
    type: 'enum',
    enum: IncidentSeverity,
    default: IncidentSeverity.MEDIUM,
    nullable: true,
  })
  severity?: IncidentSeverity;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'text' })
  image: string; // Base64 encoded image

  @Column({ default: 1 })
  report_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ nullable: true, type: 'text' })
  operatorNotes?: string;

  @Column({ nullable: true, type: 'text' })
  briefExplanation?: string;

  @Column({ nullable: true })
  reportedByUserId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reportedByUserId' })
  reportedByUser: User;
}
