import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPostsService } from './job-posts.service';
import { JobPostEntity } from './entities/job-post.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPostEntity]),
    SubscriptionsModule,
    NotificationsModule,
  ],
  providers: [JobPostsService],
  exports: [JobPostsService],
})
export class JobPostsModule {}
