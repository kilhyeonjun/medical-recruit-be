import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScrapersService } from './scrapers.service';

@Injectable()
export class ScrapersScheduler {
  private readonly logger = new Logger(ScrapersScheduler.name);

  constructor(private readonly scrapersService: ScrapersService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scrapeAll() {
    this.logger.debug('Processing scrapers');

    await this.scrapersService.scrapeAll();
  }
}
