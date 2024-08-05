import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { HospitalName } from '../../common/enums/hospital-name.enum';

@Entity('subscriptions')
export class SubscriptionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column('simple-array')
  keywords: string[];

  @Column({
    type: 'enum',
    enum: HospitalName,
  })
  hospitalName: HospitalName;
}
