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
    const allJobs: JobPostDto[] = [];

    try {
      const latestJob = await this.jobPostsService.findLatestByHospital(
        this.name,
      );

      const jobs = await this.scrapeJobsFromPage();

      for (const job of jobs) {
        if (this.isDuplicate(job, latestJob)) {
          this.logger.log(`Duplicate job found. Stopping scraping.`);
          break;
        }

        if (allJobs.findIndex((j) => j.externalId === job.externalId) === -1) {
          allJobs.push(job);
        }
      }
    } catch (error) {
      throw error;
    }

    this.logger.log(
      `Scraping completed. Total new jobs found: ${allJobs.length}`,
    );

    return allJobs.reverse();
  }

  private isDuplicate(
    newJobPost: JobPostDto,
    latestJobPost: JobPostDto | null,
  ): boolean {
    if (!latestJobPost) return false;

    return newJobPost.externalId === latestJobPost.externalId;
  }

  private async scrapeJobsFromPage(): Promise<JobPostDto[]> {
    const response = await axios
      .get<{ data: ApiJobData[] }>('https://eumc.applyin.co.kr/jobs/')
      .then((res) => res.data);

    return response.data.map(this.mapApiJobToJobPostDto);
  }

  private mapApiJobToJobPostDto(job: ApiJobData): JobPostDto {
    const isOpenUntilFilled =
      job.categories.findIndex((c) => c.text === '수시') !== -1;

    return {
      title: job.title,
      url: job.links['jobs.show'],
      externalId: job.id.toString(),
      startAt: job.start ? dayjs(job.start).toDate() : null,
      endAt: !isOpenUntilFilled && job.end ? dayjs(job.end).toDate() : null,
      isOpenUntilFilled: isOpenUntilFilled,
      hospitalName: HospitalName.Eumc,
    };
  }
}
