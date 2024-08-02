import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPostEntity } from './job-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobPostEntity])],
  providers: [ScraperService],
  controllers: [ScraperController],
})
export class ScraperModule {}
