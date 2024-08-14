import { Injectable, Logger } from '@nestjs/common';
import puppeteer, {
  Browser,
  Page,
  PuppeteerLaunchOptions,
} from 'puppeteer-core';
import { ScrapingStrategy } from '../interfaces/scraping-strategy.interface';
import { JobPostDto } from '../../job-posts/dto/job-post.dto';
import { HospitalName } from '../../common/enums/hospital-name.enum';
import { JobPostsService } from '../../job-posts/job-posts.service';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class ChCauhsScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.ChCauhs;
  private readonly logger = new Logger(ChCauhsScrapingStrategy.name);
  private readonly baseURL: string;
  private readonly maxRetries = 3;

  constructor(
    private readonly jobPostsService: JobPostsService,
    private readonly configService: ConfigService,
  ) {
    this.baseURL = 'https://ch.cauhs.or.kr/recruit/job';
  }

  async scrape(): Promise<JobPostDto[]> {
    let browser: Browser | null = null;
    const allJobs: JobPostDto[] = [];
    let isDuplicateFound = false;

    try {
      const options: PuppeteerLaunchOptions = await this.getBrowserOptions();
      browser = await puppeteer.launch(options);

      const page = await browser.newPage();
      const latestJob = await this.jobPostsService.findLatestByHospital(
        this.name,
      );

      await page.goto(`${this.baseURL}/noticeList.do`, {
        waitUntil: 'networkidle0',
      });

      let retryCount = 0;
      while (!isDuplicateFound && retryCount < this.maxRetries) {
        try {
          await page.waitForSelector('.board_wrap .table_wrap table', {
            timeout: 5000,
          });

          const jobs = await this.scrapeJobsFromPage(page);

          for (const job of jobs) {
            if (this.isDuplicate(job, latestJob)) {
              isDuplicateFound = true;
              this.logger.log('Duplicate job found. Stopping scraping.');
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

          await this.delay(200);
          retryCount = 0;
        } catch (error) {
          this.logger.error(`Error scraping page: ${error.message}`);
          retryCount++;
          if (retryCount >= this.maxRetries) {
            this.logger.error('Max retries reached. Stopping scraping.');
            break;
          }
          await this.delay(1000);
        }
      }
    } catch (error) {
      this.logger.error(`Fatal error during scraping: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    this.logger.log(
      `Scraping completed. Total new jobs found: ${allJobs.length}`,
    );

    return allJobs.reverse();
  }

  private async getBrowserOptions(): Promise<PuppeteerLaunchOptions> {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    const executablePath = this.configService.get<string>(
      'CHROME_EXECUTABLE_PATH',
    );

    if (!executablePath) {
      throw new Error(
        'CHROME_EXECUTABLE_PATH must be specified in the environment variables',
      );
    }

    const options: PuppeteerLaunchOptions = {
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (isProduction) {
      options.args.push('--disable-gpu');
      options.args.push('--disable-dev-shm-usage');
    }

    const headless = this.configService.get<string>('CHROME_HEADLESS');
    if (headless !== undefined) {
      options.headless = headless !== 'false';
    }

    return options;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      const jobElements = document.querySelectorAll(
        '.board_wrap .table_wrap table tbody tr',
      );

      return Array.from(jobElements).map((element) => {
        const dateElement = element.querySelector('.n_period');
        const titleElement = element.querySelector('.n_subject');

        if (!dateElement || !titleElement) {
          throw new Error('Required element not found');
        }

        const [startAt, endAt] =
          dateElement.textContent?.trim().split('~') ?? [];

        const jobNoticeNoRegex = /fn_Detail\('(\d+)'\)/;
        const jobNoticeNoMatch = titleElement.innerHTML.match(jobNoticeNoRegex);
        let jobNoticeNo: string;

        if (!jobNoticeNoMatch) {
          const jobNoticeNoRegex2 = /fn_readCntUpdate\('(\d+)'\)/;
          const jobNoticeNoMatch2 =
            titleElement.innerHTML.match(jobNoticeNoRegex2);

          if (!jobNoticeNoMatch2) {
            throw new Error('Job notice number not found');
          }

          jobNoticeNo = jobNoticeNoMatch2[1];
        } else {
          jobNoticeNo = jobNoticeNoMatch[1];
        }

        return {
          title: titleElement.textContent?.trim(),
          url: `${this.baseURL}/noticeView.do?jobNoticeNo=${jobNoticeNo}`,
          externalId: jobNoticeNo,
          startAt: startAt?.trim(),
          endAt: endAt?.trim(),
        };
      });
    });

    return jobsData.map((job) => ({
      ...job,
      hospitalName: this.name,
      startAt: dayjs.tz(job.startAt, 'Asia/Seoul').utc().toDate(),
      endAt: dayjs.tz(job.endAt, 'Asia/Seoul').utc().toDate(),
      isOpenUntilFilled: false,
    }));
  }

  private async goToNextPage(page: Page): Promise<boolean> {
    return page.evaluate(() => {
      const pageButtons = document.querySelectorAll(
        '.btn_paging_wrapper ol li',
      );

      if (pageButtons.length === 1) {
        return false;
      }

      if (pageButtons.length > 1) {
        throw new Error('More than one page button found');
      }

      // TODO: 변경 필요
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
