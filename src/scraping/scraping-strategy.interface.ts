export interface JobPosting {
  title: string;
  url: string;
}

export enum ScrapingStrategyName {
  StaticHospitalA = 'StaticHospitalA',
  DynamicHospitalB = 'DynamicHospitalB',
  Severance = 'Severance',
}

export interface ScrapingStrategy {
  name: ScrapingStrategyName;
  scrape(): Promise<JobPosting[]>;
}
