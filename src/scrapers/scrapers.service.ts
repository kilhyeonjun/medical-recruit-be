import { Injectable, Inject } from '@nestjs/common';
import { JobPostsService } from '../job-posts/job-posts.service';
import { ScrapingStrategy } from './interfaces/scraping-strategy.interface';

@Injectable()
export class ScrapersService {
  constructor(
    private readonly jobPostsService: JobPostsService,
    @Inject('SCRAPING_STRATEGIES')
    private readonly scrapingStrategies: ScrapingStrategy[],
  ) {}

  async scrapeAll() {
    for (const strategy of this.scrapingStrategies) {
      const jobPosts = await strategy.scrape();
      for (const jobPost of jobPosts) {
        await this.jobPostsService.create(jobPost);
      }
    }
  }
}
