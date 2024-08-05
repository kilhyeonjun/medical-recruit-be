import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPostEntity } from './entities/job-post.entity';
import { JobPostDto } from './dto/job-post.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/enums/notification-type.enum';
import { CreateNotificationDto } from '../notifications/dto/notification.dto';
import { SubscriptionEntity } from '../subscriptions/entities/subscriptions.entity';
import { HospitalName } from '../common/enums/hospital-name.enum';

@Injectable()
export class JobPostsService {
  private readonly logger = new Logger(JobPostsService.name);

  constructor(
    @InjectRepository(JobPostEntity)
    private jobPostRepository: Repository<JobPostEntity>,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMany(jobPosts: JobPostDto[]): Promise<JobPostEntity[]> {
    const savedJobs = await this.jobPostRepository.save(jobPosts);
    await this.processNotificationsForJobs(savedJobs);

    return savedJobs;
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

  private async processNotificationsForJobs(jobPosts: JobPostEntity[]) {
    const hospitalNames = [...new Set(jobPosts.map((job) => job.hospitalName))];
    const subscriptions =
      await this.subscriptionsService.getRelevantSubscriptions(hospitalNames);

    const notifications = this.generateNotifications(jobPosts, subscriptions);
    await this.notificationsService.createMany(notifications);
  }

  private generateNotifications(
    jobPosts: JobPostEntity[],
    subscriptions: SubscriptionEntity[],
  ): CreateNotificationDto[] {
    const notifications: CreateNotificationDto[] = [];

    for (const jobPost of jobPosts) {
      const relevantSubscriptions = subscriptions.filter(
        (sub) =>
          sub.hospitalName === jobPost.hospitalName &&
          this.subscriptionsService.isJobPostMatchingKeywords(
            jobPost.title,
            sub.keywords,
          ),
      );

      for (const subscription of relevantSubscriptions) {
        notifications.push({
          type: NotificationType.EMAIL,
          recipient: subscription.email,
          content: {
            subject: `새로운 채용 공고: ${jobPost.title}`,
            html: this.generateEmailHtml(jobPost, subscription),
          },
        });
      }
    }

    return notifications;
  }

  private generateEmailHtml(
    jobPost: JobPostEntity,
    subscription: SubscriptionEntity,
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>새로운 채용 공고 알림</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; }
          .footer { background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 0.8em; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>새로운 채용 공고 알림</h1>
          </div>
          <div class="content">
            <h2>${jobPost.title}</h2>
            <p>안녕하세요, ${subscription.email}님</p>
            <p>귀하의 관심사에 맞는 새로운 채용 공고가 등록되었습니다:</p>
            <ul>
              <li><strong>병원:</strong> ${jobPost.hospitalName}</li>
              <li><strong>지원 시작일:</strong> ${jobPost.startAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
              <li><strong>지원 마감일:</strong> ${jobPost.endAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
            </ul>
            <p>
              <a href="${jobPost.url}" class="button">채용 공고 상세보기</a>
            </p>
            <p>관심이 있으시다면 마감일 전에 지원해 주시기 바랍니다.</p>
          </div>
          <div class="footer">
            <p>본 이메일은 채용 공고 알림을 구독하셨기 때문에 발송되었습니다.</p>
            <p>구독을 해지하거나 설정을 변경하시려면 <a href="#">여기를 클릭</a>해 주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;
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
