import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { ScrapingStrategy } from '../interfaces/scraping-strategy.interface';
import { JobPostDto } from '../../job-posts/dto/job-post.dto';
import { HospitalName } from '../../common/enums/hospital-name.enum';
import { JobPostsService } from '../../job-posts/job-posts.service';
import axios, { AxiosInstance } from 'axios';

interface ApiJobData {
  jobnoticeSn: number;
  jobnoticeName: string;
  systemKindCode: string;
  applyStartDate: { time: number };
  applyEndDate: { time: number };
  receiptState: string;
}

interface ApiResponse {
  pageUtil: { lastPage: number; currentPage: number };
  list: ApiJobData[];
}

@Injectable()
export class CaumcScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.Caumc;
  private readonly logger = new Logger(CaumcScrapingStrategy.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseURL: string;

  constructor(private readonly jobPostsService: JobPostsService) {
    const baseURL = 'https://caumc.recruiter.co.kr';

    this.axiosInstance = axios.create({
      baseURL,
    });
  }

  async scrape(): Promise<JobPostDto[]> {
    try {
      const latestJob = await this.jobPostsService.findLatestByHospital(
        this.name,
      );
      const allJobs = await this.scrapeAllPages();
      const newJobs = this.filterNewJobs(allJobs, latestJob);

      this.logger.log(
        `Scraping completed. Total new jobs found: ${newJobs.length}`,
      );

      return newJobs;
    } catch (error) {
      this.logger.error(`Error during scraping: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async scrapeAllPages(): Promise<JobPostDto[]> {
    let currentPage = 1;
    let lastPage = 1;
    const allJobs: JobPostDto[] = [];

    do {
      try {
        const { jobs, lastPage: pageCount } =
          await this.scrapeJobsFromPage(currentPage);
        allJobs.push(...jobs);
        lastPage = pageCount;
        currentPage++;
      } catch (error) {
        this.logger.warn(
          `Error scraping page ${currentPage}: ${error.message}`,
        );
        break;
      }
    } while (currentPage <= lastPage);

    return allJobs;
  }

  private async scrapeJobsFromPage(
    page: number,
  ): Promise<{ jobs: JobPostDto[]; lastPage: number }> {
    try {
      const params = new URLSearchParams({
        pageSize: '10000',
        currentPage: page.toString(),
      });

      const { data } = await this.axiosInstance.post<ApiResponse>(
        `/app/jobnotice/list.json?${params.toString()}`,
      );

      const jobs = data.list.map((job) => this.mapApiJobToJobPostDto(job));

      return { jobs, lastPage: data.pageUtil.lastPage };
    } catch (error) {
      this.logger.error(
        `Error fetching jobs for page ${page}: ${error.message}`,
        error.stack,
      );
      throw new Error(
        `Failed to fetch jobs for page ${page}: ${error.message}`,
      );
    }
  }

  private filterNewJobs(
    jobs: JobPostDto[],
    latestJob: JobPostDto | null,
  ): JobPostDto[] {
    if (!latestJob) return jobs;

    const latestJobIndex = jobs.findIndex(
      (job) => job.externalId === latestJob.externalId,
    );

    return latestJobIndex === -1 ? jobs : jobs.slice(0, latestJobIndex);
  }

  private mapApiJobToJobPostDto(job: ApiJobData): JobPostDto {
    const jobnoticeSn = job.jobnoticeSn.toString();

    return {
      title: job.jobnoticeName,
      url: `${this.baseURL}/app/jobnotice/view?systemKindCode=${job.systemKindCode}&jobnoticeSn=${jobnoticeSn}`,
      externalId: jobnoticeSn,
      startAt: dayjs(job.applyStartDate.time).toDate(),
      endAt: dayjs(job.applyEndDate.time).toDate(),
      isOpenUntilFilled: false,
      hospitalName: this.name,
    };
  }
}
