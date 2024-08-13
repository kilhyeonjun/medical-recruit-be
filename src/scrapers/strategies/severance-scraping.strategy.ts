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
export class SeveranceScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.Severance;
  private readonly logger = new Logger(SeveranceScrapingStrategy.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseURL: string;

  constructor(private readonly jobPostsService: JobPostsService) {
    this.baseURL = 'https://yuhs.recruiter.co.kr';

    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
    });
  }

  async scrape(pageSize: number = 100): Promise<JobPostDto[]> {
    try {
      const latestJob = await this.jobPostsService.findLatestByHospital(
        this.name,
      );
      const allJobs = await this.scrapeAllPages(pageSize, latestJob);
      const newJobs = this.filterNewJobs(allJobs, latestJob);

      this.logger.log(
        `Scraping completed. Total new jobs found: ${newJobs.length}`,
      );

      return newJobs.reverse();
    } catch (error) {
      this.logger.error(`Error during scraping: ${error.message}`, error.stack);
      throw error;
    }
  }

  private isDuplicate(
    newJobPost: JobPostDto,
    latestJobPost: JobPostDto | null,
  ): boolean {
    return latestJobPost
      ? newJobPost.externalId === latestJobPost.externalId
      : false;
  }

  private async scrapeAllPages(
    pageSize: number,
    latestJob: JobPostDto | null,
  ): Promise<JobPostDto[]> {
    let currentPage = 1;
    let lastPage = 1;
    const allJobs: JobPostDto[] = [];

    do {
      const { jobs, lastPage: pageCount } = await this.scrapeJobsFromPage(
        pageSize,
        currentPage,
      );

      for (const job of jobs) {
        if (this.isDuplicate(job, latestJob)) {
          this.logger.log(`Duplicate job found. Stopping filtering.`);

          return allJobs;
        }

        allJobs.push(job);
      }

      lastPage = pageCount;
      currentPage++;
    } while (currentPage <= lastPage);

    return allJobs;
  }

  private async scrapeJobsFromPage(
    pageSize: number,
    page: number,
  ): Promise<{ jobs: JobPostDto[]; lastPage: number }> {
    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
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
