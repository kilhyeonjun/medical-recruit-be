import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionEntity } from './entities/subscriptions.entity';

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

  async findAll(): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.find();
  }

  async findByEmail(email: string): Promise<SubscriptionEntity[]> {
    return this.subscriptionRepository.find({ where: { email } });
  }
}
