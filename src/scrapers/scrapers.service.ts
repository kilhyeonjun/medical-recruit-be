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
      this.logger.log(`Starting scraping for ${strategy.name}`);
      const jobPosts = await strategy.scrape();
      if (jobPosts.length > 0) {
        await this.jobPostsService.createMany(jobPosts);
        this.logger.log(
          `Saved ${jobPosts.length} new job posts for ${strategy.name}`,
        );
      } else {
        this.logger.log(`No new job posts found for ${strategy.name}`);
      }
    }
  }
}
