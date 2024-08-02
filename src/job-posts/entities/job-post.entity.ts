import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { HospitalName } from '../../common/enums/hospital-name.enum';

@Entity('job_posts')
export class JobPostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 512, nullable: true })
  url: string;

  @Column({ length: 255 })
  externalId: string;

  @Column({ type: 'enum', enum: HospitalName })
  hospitalName: HospitalName;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
