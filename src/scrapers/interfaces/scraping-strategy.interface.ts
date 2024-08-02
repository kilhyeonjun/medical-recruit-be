import { JobPostDto } from '../../job-posts/dto/job-post.dto';
import { HospitalName } from '../../common/enums/hospital-name.enum';

export const SCRAPING_STRATEGIES = 'SCRAPING_STRATEGIES';

export interface ScrapingStrategy {
  name: HospitalName;
  scrape(): Promise<JobPostDto[]>;
}
