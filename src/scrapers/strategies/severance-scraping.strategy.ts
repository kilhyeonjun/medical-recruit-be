import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import puppeteer, { Page } from 'puppeteer';
import { ScrapingStrategy } from '../interfaces/scraping-strategy.interface';
import { JobPostDto } from '../../job-posts/dto/job-post.dto';
import { HospitalName } from '../../common/enums/hospital-name.enum';

@Injectable()
export class SeveranceScrapingStrategy implements ScrapingStrategy {
  name = HospitalName.Severance;

  async scrape(): Promise<JobPostDto[]> {
    const browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
    });
    const page = await browser.newPage();
    const allJobs: JobPostDto[] = [];

    try {
      await page.goto('https://yuhs.recruiter.co.kr/app/jobnotice/list', {
        waitUntil: 'networkidle0',
      });

      while (true) {
        await page.waitForSelector('.list-bbs', { timeout: 5000 });

        const jobs = await this.scrapeJobsFromPage(page);
        allJobs.push(...jobs);

        if (!(await this.goToNextPage(page))) {
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error during scraping:', error);
    } finally {
      await browser.close();
    }

    return allJobs;
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
