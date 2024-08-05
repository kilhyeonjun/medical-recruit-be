import { Inject, Injectable, Logger } from '@nestjs/common';
import { JobPostsService } from '../job-posts/job-posts.service';
import {
  SCRAPING_STRATEGIES,
  ScrapingStrategy,
} from './interfaces/scraping-strategy.interface';

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);

  constructor(
    private readonly jobPostsService: JobPostsService,
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
  }
}
