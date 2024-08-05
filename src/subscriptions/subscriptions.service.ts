import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HospitalName } from '../common/enums/hospital-name.enum';
import { SubscriptionEntity } from './entities/subscriptions.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepository: Repository<SubscriptionEntity>,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionEntity> {
    const subscription = this.subscriptionRepository.create(
      createSubscriptionDto,
    );

    return this.subscriptionRepository.save(subscription);
  }

  async getRelevantSubscriptions(
    hospitalNames: HospitalName[],
  ): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.find({
      where: { hospitalName: In(hospitalNames) },
    });
  }

  isJobPostMatchingKeywords(title: string, keywords: string[]): boolean {
    const lowercaseTitle = title.toLowerCase();

    return keywords.some((keyword) =>
      lowercaseTitle.includes(keyword.toLowerCase()),
    );
  }
}
