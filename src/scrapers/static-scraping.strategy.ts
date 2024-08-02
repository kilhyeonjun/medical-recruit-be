// import {
//   ScrapingStrategy,
//   JobPosting,
//   ScrapingStrategyName,
// } from './scraping-strategy.interface';
// import axios from 'axios';
// import * as cheerio from 'cheerio';

// export class StaticScrapingStrategy implements ScrapingStrategy {
//   name = ScrapingStrategyName.StaticHospitalA;

//   async scrape(): Promise<JobPosting[]> {
//     const url = 'https://hospital-a-jobs.com';
//     const response = await axios.get(url);
//     const $ = cheerio.load(response.data);
//     const jobs: JobPosting[] = [];

//     $('.job-posting').each((index, element) => {
//       jobs.push({
//         title: $(element).find('.job-title').text().trim(),
//         institution: 'Hospital A',
//         location: $(element).find('.job-location').text().trim(),
//         specialty: $(element).find('.job-specialty').text().trim(),
//       });
//     });

//     return jobs;
//   }
// }
