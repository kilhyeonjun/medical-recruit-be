import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Controller('scrapers')
@UseGuards(ApiKeyGuard)
export class ScrapersController {
  constructor(private readonly scrapersService: ScrapersService) {}

  @Post()
  async scrape(
    @Body('hospitalName') hospitalName: HospitalName,
    @Body('isNotification') isNotification: boolean,
  ) {
    if (hospitalName) {
      return this.scrapersService.scrapeOne(hospitalName, isNotification);
    }

    return this.scrapersService.scrapeAll(isNotification);
  }
}
