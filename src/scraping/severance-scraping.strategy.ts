import {
  ScrapingStrategy,
  JobPosting,
  ScrapingStrategyName,
} from './scraping-strategy.interface';
import puppeteer, { PuppeteerLaunchOptions } from 'puppeteer';

export class SeveranceScrapingStrategy implements ScrapingStrategy {
  name = ScrapingStrategyName.Severance;

  async scrape(): Promise<JobPosting[]> {
    const options: PuppeteerLaunchOptions = {
      headless: process.env.NODE_ENV === 'production',
    };
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();
    await page.goto('https://yuhs.recruiter.co.kr/app/jobnotice/list');

    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForSelector('.list-bbs');

    const jobs = await page.evaluate(() => {
      const jobElements = document.querySelectorAll('.list-bbs li');
      return Array.from(jobElements).map((element) => {
        const date = element.querySelector('.list-bbs-date').textContent.trim();

        return {
          title: element
            .querySelector('.list-bbs-notice-name')
            .textContent.trim(),
          startAt: date.split('~')[0].trim(),
          endAt: date.split('~')[1].trim(),
          url: (
            element.querySelector(
              '.list-bbs-notice-name a',
            ) as HTMLAnchorElement
          ).href,
        };
      });
    });

    await browser.close();

    return jobs;
  }
}
