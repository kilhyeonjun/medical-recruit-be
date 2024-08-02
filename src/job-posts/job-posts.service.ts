import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPostEntity } from './entities/job-post.entity';
import { JobPostDto } from './dto/job-post.dto';

@Injectable()
export class JobPostsService {
  constructor(
    @InjectRepository(JobPostEntity)
    private jobPostRepository: Repository<JobPostEntity>,
  ) {}

  async findAll(): Promise<JobPostEntity[]> {
    return this.jobPostRepository.find();
  }

  async findOne(id: number): Promise<JobPostEntity> {
    return this.jobPostRepository.findOne({ where: { id } });
  }

  async create(jobPostDto: JobPostDto): Promise<JobPostEntity> {
    const jobPost = this.jobPostRepository.create(jobPostDto);
    return this.jobPostRepository.save(jobPost);
  }
}
