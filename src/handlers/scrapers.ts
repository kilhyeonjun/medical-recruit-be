/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Context, ScheduledEvent } from 'aws-lambda';
import { ScrapersService } from '../scrapers/scrapers.service';
import { HospitalName } from '../common/enums/hospital-name.enum';

export const scrapeSeverance = async (
  event: ScheduledEvent,
  context: Context,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const scrapersService = app.get(ScrapersService);

  await scrapersService.scrapeOne(HospitalName.Severance);

  await app.close();
};
