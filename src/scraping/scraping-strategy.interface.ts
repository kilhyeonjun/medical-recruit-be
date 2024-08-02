import { OmitType } from '@nestjs/mapped-types';
import { JobPostEntity } from './job-post.entity';

export class JobPostDto extends OmitType(JobPostEntity, [
  'id',
  'createdAt',
] as const) {}

export enum ScrapingStrategyName {
  StaticHospitalA = 'StaticHospitalA',
  DynamicHospitalB = 'DynamicHospitalB',
  Severance = 'Severance',
}

export interface ScrapingStrategy {
  name: ScrapingStrategyName;
  scrape(): Promise<JobPostDto[]>;
}
