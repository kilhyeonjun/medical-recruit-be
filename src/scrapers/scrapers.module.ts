import { Module } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { JobPostsModule } from '../job-posts/job-posts.module';
import { scrapers } from './strategies';
import { SCRAPING_STRATEGIES } from './interfaces/scraping-strategy.interface';

@Module({
  imports: [JobPostsModule],
  providers: [
    ...scrapers,
    {
      provide: SCRAPING_STRATEGIES,
      useFactory: (...strategies) => strategies,
      inject: scrapers,
    },
    ScrapersService,
  ],
  exports: [ScrapersService],
})
export class ScrapersModule {}
