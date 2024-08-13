import { Injectable, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
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

@Injectable()
export class SeveranceScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.Severance;
  private readonly logger = new Logger(SeveranceScrapingStrategy.name);

  constructor(
    private readonly jobPostsService: JobPostsService,
    private readonly configService: ConfigService,
  ) {}

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

        await this.delay(200);
      }
    } catch (error) {
      throw error;
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

    // TODO: Serverless @sparticuz/chromium
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
      // EC2 might require additional configurations
      options.args.push('--disable-gpu');
      options.args.push('--disable-dev-shm-usage');
    }

    // Override headless mode if specified in config
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

        const params = new URLSearchParams(linkElement.href.split('?')[1]);
        const jobnoticeSn = params.get('jobnoticeSn');

        return {
          title: titleElement.textContent?.trim(),
          url: linkElement.href,
          externalId: jobnoticeSn,
          startAt: startAt?.trim(),
          endAt: endAt?.trim(),
        };
      });
    });

    return jobsData.map((job) => ({
      ...job,
      hospitalName: this.name,
      startAt: dayjs(job.startAt).toDate(),
      endAt: dayjs(job.endAt).toDate(),
      isOpenUntilFilled: false,
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
