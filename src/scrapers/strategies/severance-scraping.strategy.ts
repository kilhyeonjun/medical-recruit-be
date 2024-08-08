import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import puppeteer, { Page } from 'puppeteer';
import { ScrapingStrategy } from '../interfaces/scraping-strategy.interface';
import { JobPostDto } from '../../job-posts/dto/job-post.dto';
import { HospitalName } from '../../common/enums/hospital-name.enum';
import { JobPostsService } from '../../job-posts/job-posts.service';

@Injectable()
export class SeveranceScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.Severance;
  private readonly logger = new Logger(SeveranceScrapingStrategy.name);

  constructor(private readonly jobPostsService: JobPostsService) {}

  async scrape(): Promise<JobPostDto[]> {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
    });
    const page = await browser.newPage();
    const allJobs: JobPostDto[] = [];
    let isDuplicateFound = false;

    try {
      const latestJob = await this.jobPostsService.findLatestByHospital(
        this.name,
      );

      await page.goto('https://yuhs.recruiter.co.kr/app/jobnotice/list', {
        waitUntil: 'networkidle0',
      });

      while (!isDuplicateFound) {
        await page.waitForSelector('.list-bbs', { timeout: 5000 });

        const jobs = await this.scrapeJobsFromPage(page);

        for (const job of jobs) {
          if (this.isDuplicate(job, latestJob)) {
            isDuplicateFound = true;
            this.logger.log(`Duplicate job found. Stopping scraping.`);
            break;
          }

          if (
            allJobs.findIndex((j) => j.externalId === job.externalId) === -1
          ) {
            allJobs.push(job);
          }
        }

        if (isDuplicateFound || !(await this.goToNextPage(page))) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      this.logger.error('Error during scraping:', error);
    } finally {
      await browser.close();
    }

    this.logger.log(
      `Scraping completed. Total new jobs found: ${allJobs.length}`,
    );

    return allJobs.reverse(); // 스크랩한 데이터를 역순으로 반환
  }

  private isDuplicate(
    newJobPost: JobPostDto,
    latestJobPost: JobPostDto | null,
  ): boolean {
    if (!latestJobPost) return false;

    return newJobPost.externalId === latestJobPost.externalId;
  }

  private async scrapeJobsFromPage(page: Page): Promise<JobPostDto[]> {
    const jobsData = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('.list-bbs li');

      return Array.from(jobElements).map((element) => {
        const dateElement = element.querySelector('.list-bbs-date');
        const titleElement = element.querySelector('.list-bbs-notice-name');
        const linkElement = element.querySelector(
          '.list-bbs-notice-name a',
        ) as HTMLAnchorElement;

        if (!dateElement || !titleElement || !linkElement) {
          throw new Error('Required element not found');
        }

        const [startAt, endAt] =
          dateElement.textContent?.trim().split('~') ?? [];

        return {
          title: titleElement.textContent?.trim() ?? '',
          url: linkElement.href,
          externalId: linkElement.href.split('/').pop() ?? '',
          startAt: startAt?.trim() ?? '',
          endAt: endAt?.trim() ?? '',
        };
      });
    });

    return jobsData.map((job) => ({
      ...job,
      hospitalName: this.name,
      startAt: dayjs(job.startAt).toDate(),
      endAt: dayjs(job.endAt).toDate(),
    }));
  }

  private async goToNextPage(page: Page): Promise<boolean> {
    return page.evaluate(() => {
      const pageButtons = document.querySelectorAll('.paging-wrapper li a');
      const currentButtonIndex = Array.from(pageButtons).findIndex((button) =>
        button.classList.contains('active'),
      );
      const nextButton = pageButtons[currentButtonIndex + 1] as HTMLElement;

      if (nextButton) {
        nextButton.click();

        return true;
      }

      return false;
    });
  }
}
