// import {
//   ScrapingStrategy,
//   JobPosting,
//   ScrapingStrategyName,
// } from './scraping-strategy.interface';
// import puppeteer from 'puppeteer';

// export class DynamicScrapingStrategy implements ScrapingStrategy {
//   name = ScrapingStrategyName.DynamicHospitalB;

//   async scrape(): Promise<JobPosting[]> {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();
//     await page.goto('https://hospital-b-jobs.com');

//     // 페이지가 완전히 로드될 때까지 대기
//     await page.waitForSelector('.job-listing');

//     const jobs = await page.evaluate(() => {
//       const jobElements = document.querySelectorAll('.job-listing');
//       return Array.from(jobElements).map((element) => ({
//         title: element.querySelector('.job-title').textContent.trim(),
//         institution: 'Hospital B',
//         location: element.querySelector('.job-location').textContent.trim(),
//         specialty: element.querySelector('.job-specialty').textContent.trim(),
//       }));
//     });

//     await browser.close();
//     return jobs;
//   }
// }
