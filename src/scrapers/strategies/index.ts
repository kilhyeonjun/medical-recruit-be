import { CaumcScrapingStrategy } from './caumc-scraping.strategy';
import { EumcScrapingStrategy } from './eumc-scraping.strategy';
import { SeveranceScrapingStrategy } from './severance-scraping.strategy';

export const scrapers = [
  SeveranceScrapingStrategy,
  EumcScrapingStrategy,
  CaumcScrapingStrategy,
];

export * from './severance-scraping.strategy';
