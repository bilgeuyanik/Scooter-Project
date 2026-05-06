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
  role!: string; // 'User' veya 'Operator' [cite: 25]
}