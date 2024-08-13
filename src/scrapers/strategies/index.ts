import { EumcScrapingStrategy } from './eumc-scraping.strategy';
import { SeveranceScrapingStrategy } from './severance-scraping.strategy';

export const scrapers = [SeveranceScrapingStrategy, EumcScrapingStrategy];

export * from './severance-scraping.strategy';
