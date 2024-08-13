import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { ScrapingStrategy } from '../interfaces/scraping-strategy.interface';
import { JobPostDto } from '../../job-posts/dto/job-post.dto';
import { HospitalName } from '../../common/enums/hospital-name.enum';
import { JobPostsService } from '../../job-posts/job-posts.service';
import axios from 'axios';

interface ApiJobData {
  id: number;
  title: string;
  status: { code: 'ing' | 'Open' | 'close' | string; text: string };
  categories: { id: number; value: string; text: string }[];
  start: string;
  end: string;
  links: { 'jobs.show': string };
  content: string | null;
}

@Injectable()
export class EumcScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.Eumc;
  private readonly logger = new Logger(EumcScrapingStrategy.name);

  constructor(private readonly jobPostsService: JobPostsService) {}

  async scrape(): Promise<JobPostDto[]> {
    try {
      const latestJob = await this.jobPostsService.findLatestByHospital(
        this.name,
      );
      const jobs = await this.scrapeJobsFromPage();
      const newJobs = this.filterNewJobs(jobs, latestJob);

      this.logger.log(
        `Scraping completed. Total new jobs found: ${newJobs.length}`,
      );

      return newJobs.reverse();
    } catch (error) {
      this.logger.error(`Error during scraping: ${error.message}`, error.stack);
      throw error;
    }
  }

  private filterNewJobs(
    jobs: JobPostDto[],
    latestJob: JobPostDto | null,
  ): JobPostDto[] {
    const newJobs: JobPostDto[] = [];
    for (const job of jobs) {
      if (this.isDuplicate(job, latestJob)) {
        this.logger.log(`Duplicate job found. Stopping filtering.`);
        break;
      }
      if (!newJobs.some((j) => j.externalId === job.externalId)) {
        newJobs.push(job);
      }
    }

    return newJobs;
  }

  private isDuplicate(
    newJobPost: JobPostDto,
    latestJobPost: JobPostDto | null,
  ): boolean {
    return latestJobPost
      ? newJobPost.externalId === latestJobPost.externalId
      : false;
  }

  private async scrapeJobsFromPage(): Promise<JobPostDto[]> {
    try {
      const response = await axios.get<{ data: ApiJobData[] }>(
        'https://eumc.applyin.co.kr/jobs/',
      );

      return response.data.data.map(this.mapApiJobToJobPostDto.bind(this));
    } catch (error) {
      this.logger.error(`Error fetching jobs: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapApiJobToJobPostDto(job: ApiJobData): JobPostDto {
    const isOpenUntilFilled = job.categories.some((c) => c.text === '수시');

    return {
      title: job.title,
      url: `https://eumc.applyin.co.kr/jobs/${job.id}`,
      externalId: job.id.toString(),
      startAt: job.start ? dayjs(job.start).toDate() : null,
      endAt: !isOpenUntilFilled && job.end ? dayjs(job.end).toDate() : null,
      isOpenUntilFilled,
      hospitalName: this.name,
    };
  }
}
