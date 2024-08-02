import { OmitType } from '@nestjs/mapped-types';
import { JobPostEntity } from '../entities/job-post.entity';

export class JobPostDto extends OmitType(JobPostEntity, [
  'id',
  'createdAt',
] as const) {}
