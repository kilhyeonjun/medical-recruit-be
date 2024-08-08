import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScrapersService } from './scrapers.service';
import {} from './interfaces/scraping-strategy.interface';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Injectable()
export class ScrapersScheduler {
  private readonly logger = new Logger(ScrapersScheduler.name);

  constructor(private readonly scrapersService: ScrapersService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scrapeSeverance() {
    this.logger.debug('Processing scrapers');

    await this.scrapersService.scrapeOne(HospitalName.Severance);
  }
}
