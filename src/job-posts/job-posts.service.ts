import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JobPostEntity } from './entities/job-post.entity';
import { JobPostDto } from './dto/job-post.dto';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Injectable()
export class JobPostsService {
  constructor(
    @InjectRepository(JobPostEntity)
    private jobPostRepository: Repository<JobPostEntity>,
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<JobPostEntity[]> {
    return this.jobPostRepository.find();
  }

  async findOne(id: number): Promise<JobPostEntity> {
    return this.jobPostRepository.findOne({ where: { id } });
  }

  async findLatestByHospital(
    hospitalName: HospitalName,
  ): Promise<JobPostDto | null> {
    const latestJob = await this.jobPostRepository.findOne({
      where: { hospitalName },
      order: { id: 'DESC' },
    });

    return latestJob ? this.entityToDto(latestJob) : null;
  }

  async create(jobPostDto: JobPostDto): Promise<JobPostEntity> {
    const jobPost = this.jobPostRepository.create(jobPostDto);

    return this.jobPostRepository.save(jobPost);
  }

  async createMany(jobPosts: JobPostDto[]): Promise<JobPostEntity[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedEntities: JobPostEntity[] = [];
      for (const jobPost of jobPosts) {
        const entity = this.jobPostRepository.create(jobPost);
        const savedEntity = await queryRunner.manager.save(entity);
        savedEntities.push(savedEntity);
      }
      await queryRunner.commitTransaction();

      return savedEntities;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private entityToDto(entity: JobPostEntity): JobPostDto {
    return {
      title: entity.title,
      url: entity.url,
      externalId: entity.externalId,
      hospitalName: entity.hospitalName,
      startAt: entity.startAt,
      endAt: entity.endAt,
    };
  }
}
