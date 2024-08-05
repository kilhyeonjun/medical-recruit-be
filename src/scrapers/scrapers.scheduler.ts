import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScrapersService } from './scrapers.service';
import {
  SCRAPING_STRATEGIES,
  ScrapingStrategy,
} from './interfaces/scraping-strategy.interface';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Injectable()
export class ScrapersScheduler {
  private readonly logger = new Logger(ScrapersScheduler.name);

  constructor(
    private readonly scrapersService: ScrapersService,
    @Inject(SCRAPING_STRATEGIES)
    private readonly scrapingStrategies: ScrapingStrategy[],
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.debug('Processing scrapers');
    const severance = this.scrapingStrategies.find(
      (strategy) => strategy.name === HospitalName.Severance,
    );

    await this.scrapersService.scrapeAndProcessStrategy(severance);
  }
}
