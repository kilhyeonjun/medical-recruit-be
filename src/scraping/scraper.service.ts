import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPostDto, ScrapingStrategy } from './scraping-strategy.interface';
import { SeveranceScrapingStrategy } from './severance-scraping.strategy';
import { JobPostEntity } from './job-post.entity';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private strategies: ScrapingStrategy[];

  constructor(
    @InjectRepository(JobPostEntity)
    private jobPostRepository: Repository<JobPostEntity>,
  ) {
    this.strategies = [new SeveranceScrapingStrategy()];
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runScraping() {
    this.logger.log('Starting scraping tasks');
    for (const strategy of this.strategies) {
      await this.processScraping(strategy.name);
    }
  }

  async processScraping(strategyName: string) {
    const strategy = this.strategies.find((s) => s.name === strategyName);
    if (!strategy) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    try {
      this.logger.log(`Starting scraping for ${strategyName}`);
      const results = await strategy.scrape();

      await this.saveResults(results);
      this.logger.log(`Completed scraping for ${strategyName}`);
    } catch (error) {
      this.logger.error(`Error during scraping for ${strategyName}`, error);
      await this.saveError(strategyName, error);
    }
  }

  private async saveResults(results: JobPostDto[]) {
    console.log(results);

    try {
      const jobPosts = results.map((result) =>
        this.jobPostRepository.create(result),
      );

      await this.jobPostRepository.save(jobPosts);
    } catch (error) {
      this.logger.error('Error saving job posts', error);
      throw error;
    }
  }

  private async saveError(strategyName: string, error: Error) {
    this.logger.error(
      `Error during scraping for ${strategyName}: ${error.message}`,
    );
  }

  // 수동으로 스크래핑을 트리거하는 메서드 (필요시 사용)
  async manualTrigger(strategyName?: string) {
    if (strategyName) {
      await this.processScraping(strategyName);
    } else {
      await this.runScraping();
    }
  }
}
