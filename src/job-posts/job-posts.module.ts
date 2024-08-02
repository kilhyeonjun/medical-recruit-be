import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPostsService } from './job-posts.service';
import { JobPostEntity } from './entities/job-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JobPostEntity])],
  providers: [JobPostsService],
  exports: [JobPostsService],
})
export class JobPostsModule {}
