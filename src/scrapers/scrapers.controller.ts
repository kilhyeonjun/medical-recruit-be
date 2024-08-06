import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Controller('scrapers')
@UseGuards(ApiKeyGuard)
export class ScrapersController {
  constructor(private readonly scrapersService: ScrapersService) {}

  @Post()
  async scrape(@Body('hospitalName') hospitalName: HospitalName) {
    if (hospitalName) {
      return this.scrapersService.scrapeOne(hospitalName);
    }

    return this.scrapersService.scrapeAll();
  }
}
