import { Inject, Injectable, Logger } from '@nestjs/common';
import { JobPostsService } from '../job-posts/job-posts.service';
import {
  SCRAPING_STRATEGIES,
  ScrapingStrategy,
} from './interfaces/scraping-strategy.interface';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);

  constructor(
    private readonly jobPostsService: JobPostsService,
    @Inject(SCRAPING_STRATEGIES)
    private readonly scrapingStrategies: ScrapingStrategy[],
  ) {}

  async scrapeAll(isNotification = true) {
    for (const strategy of this.scrapingStrategies) {
      await this.scrapeAndProcessStrategy(strategy, isNotification);
    }
  }

  async scrapeOne(hospitalName: HospitalName, isNotification = true) {
    const strategy = this.findStrategyByName(hospitalName);

    if (!strategy) {
      throw new Error(`No strategy found for ${hospitalName}`);
    }

    await this.scrapeAndProcessStrategy(strategy, isNotification);
  }

  private findStrategyByName(
    hospitalName: HospitalName,
  ): ScrapingStrategy | undefined {
    return this.scrapingStrategies.find(
      (strategy) => strategy.name === hospitalName,
    );
  }

  private async scrapeAndProcessStrategy(
    strategy: ScrapingStrategy,
    isNotification = true,
  ) {
    this.logScrapingStart(strategy.name);
    const jobPosts = await strategy.scrape();

    if (jobPosts.length === 0) {
      this.logNoNewJobPosts(strategy.name);

      return;
    }

    const savedJobs = await this.jobPostsService.createMany(
      jobPosts,
      isNotification,
    );
    this.logSavedJobPosts(savedJobs.length, strategy.name);
  }

  private logScrapingStart(strategyName: string): void {
    this.logger.log(`Starting scraping for ${strategyName}`);
  }

  private logNoNewJobPosts(strategyName: string): void {
    this.logger.log(`No new job posts found for ${strategyName}`);
  }

  private logSavedJobPosts(savedJobsCount: number, strategyName: string): void {
    this.logger.log(
      `Saved ${savedJobsCount} new job posts for ${strategyName}`,
    );
  }
}
