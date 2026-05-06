import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  password!: string;

  @Column()
  role!: string; 

  @Column({ type: 'double precision', default: 100.0 }) 
  balance: number;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  avatar?: string; // Base64 avatar resmi
}