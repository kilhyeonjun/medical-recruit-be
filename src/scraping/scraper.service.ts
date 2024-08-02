import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { ScrapingStrategy } from './scraping-strategy.interface';
import { SeveranceScrapingStrategy } from './severance-scraping.strategy';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly dbPool: Pool;
  private strategies: ScrapingStrategy[];

  constructor(private configService: ConfigService) {
    // this.dbPool = new Pool({
    //   connectionString: this.configService.get<string>('DATABASE_URL'),
    // });
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

      console.log(results);

      // await this.saveResults(strategyName, results);
      this.logger.log(`Completed scraping for ${strategyName}`);
    } catch (error) {
      this.logger.error(`Error during scraping for ${strategyName}`, error);
      // await this.saveError(strategyName, error);
    }
  }

  private async saveResults(strategyName: string, results: any[]) {
    const client = await this.dbPool.connect();
    try {
      await client.query('BEGIN');
      for (const result of results) {
        await client.query(
          'INSERT INTO scraping_results (strategy, data, created_at) VALUES ($1, $2, $3)',
          [strategyName, result, new Date()],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async saveError(strategyName: string, error: Error) {
    const client = await this.dbPool.connect();
    try {
      await client.query(
        'INSERT INTO scraping_errors (strategy, error_message, created_at) VALUES ($1, $2, $3)',
        [strategyName, error.message, new Date()],
      );
    } finally {
      client.release();
    }
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
