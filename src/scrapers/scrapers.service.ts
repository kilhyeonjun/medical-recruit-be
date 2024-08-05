import { Inject, Injectable, Logger } from '@nestjs/common';
import { JobPostsService } from '../job-posts/job-posts.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  SCRAPING_STRATEGIES,
  ScrapingStrategy,
} from './interfaces/scraping-strategy.interface';
import { JobPostDto } from '../job-posts/dto/job-post.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionEntity } from '../subscriptions/entities/subscriptions.entity';
import { NotificationType } from '../notifications/enums/notification-type.enum';

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);

  constructor(
    private readonly jobPostsService: JobPostsService,
    private readonly notificationsService: NotificationsService,
    private readonly subscriptionsService: SubscriptionsService,
    @Inject(SCRAPING_STRATEGIES)
    private readonly scrapingStrategies: ScrapingStrategy[],
  ) {}

  async scrapeAll() {
    for (const strategy of this.scrapingStrategies) {
      await this.scrapeAndProcessStrategy(strategy);
    }
  }

  private async scrapeAndProcessStrategy(strategy: ScrapingStrategy) {
    this.logger.log(`Starting scraping for ${strategy.name}`);
    const jobPosts = await strategy.scrape();

    if (jobPosts.length === 0) {
      this.logger.log(`No new job posts found for ${strategy.name}`);

      return;
    }

    const savedJobs = await this.jobPostsService.createMany(jobPosts);
    this.logger.log(
      `Saved ${savedJobs.length} new job posts for ${strategy.name}`,
    );

    await this.processNotificationsForJobs(savedJobs);
  }

  private async processNotificationsForJobs(jobPosts: JobPostDto[]) {
    const hospitalNames = [...new Set(jobPosts.map((job) => job.hospitalName))];
    const subscriptions =
      await this.subscriptionsService.getRelevantSubscriptions(hospitalNames);

    const notifications = this.generateNotifications(jobPosts, subscriptions);
    await this.notificationsService.createMany(notifications);
  }

  private generateNotifications(
    jobPosts: JobPostDto[],
    subscriptions: SubscriptionEntity[],
  ) {
    const notifications = [];

    for (const jobPost of jobPosts) {
      const relevantSubscriptions = subscriptions.filter(
        (sub) =>
          sub.hospitalName === jobPost.hospitalName &&
          this.subscriptionsService.isJobPostMatchingKeywords(
            jobPost.title,
            sub.keywords,
          ),
      );

      for (const subscription of relevantSubscriptions) {
        notifications.push({
          type: NotificationType.EMAIL,
          recipient: subscription.email,
          content: {
            title: jobPost.title,
            hospitalName: jobPost.hospitalName,
          },
        });
      }
    }

    return notifications;
  }
}
