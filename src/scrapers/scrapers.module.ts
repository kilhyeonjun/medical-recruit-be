import { Module } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { JobPostsModule } from '../job-posts/job-posts.module';
import { scrapers } from './strategies';
import { SCRAPING_STRATEGIES } from './interfaces/scraping-strategy.interface';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [JobPostsModule, NotificationsModule, SubscriptionsModule],
  providers: [
    ...scrapers,
    {
      provide: SCRAPING_STRATEGIES,
      useFactory: (...strategies) => strategies,
      inject: scrapers,
    },
    ScrapersService,
  ],
  exports: [ScrapersService],
})
export class ScrapersModule {}
