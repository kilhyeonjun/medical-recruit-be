import { Controller, Get, Query } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScrapingStrategyName } from './scraping-strategy.interface';

@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // TODO: 특정 key에서만 동작 필요 (자원 낭비 방지)
  @Get()
  async getScrapedData(
    @Query('strategy_name') strategyName: string,
  ): Promise<boolean> {
    await this.scraperService.manualTrigger(
      strategyName || ScrapingStrategyName.Severance,
    );

    return true;
  }
}
