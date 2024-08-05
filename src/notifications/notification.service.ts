import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import {
  Notification,
  NotificationStatus,
} from './entities/notification.entity';
import { NotificationType } from './enums/notification-type.enum';
import { EmailService } from '../email/email.service';
import dayjs from 'dayjs';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
  ) {}

  async createNotification(
    type: NotificationType,
    recipient: string,
    content: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      type,
      recipient,
      content,
      status: NotificationStatus.PENDING,
    });

    return this.notificationRepository.save(notification);
  }

  async processNotifications() {
    const notificationsToProcess =
      await this.selectNotificationsForProcessing();

    for (const notification of notificationsToProcess) {
      await this.processNotification(notification);
    }
  }

  private async selectNotificationsForProcessing(): Promise<Notification[]> {
    return this.notificationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const notifications = await transactionalEntityManager
          .createQueryBuilder(Notification, 'notification')
          .setLock('pessimistic_write')
          .where({
            status: NotificationStatus.PENDING,
            processingStartedAt: LessThan(
              dayjs().subtract(5, 'minute').toDate(),
            ),
          })
          .orderBy('notification.createdAt', 'ASC')
          .take(10)
          .getMany();

        if (notifications.length > 0) {
          const notificationIds = notifications.map((n) => n.id);
          await transactionalEntityManager.update(
            Notification,
            { id: In(notificationIds) },
            {
              status: NotificationStatus.PROCESSING,
              processingStartedAt: new Date(),
            },
          );
        }

        return notifications;
      },
    );
  }

  private async processNotification(notification: Notification) {
    try {
      switch (notification.type) {
        case NotificationType.EMAIL:
          await this.emailService.sendEmail(
            notification.recipient,
            notification.content.subject,
            notification.content.html,
          );
          break;
        default:
          throw new Error(
            `Unsupported notification type: ${notification.type}`,
          );
      }

      await this.markNotificationAsSent(notification.id);
      this.logger.log(`Notification sent: ${notification.id}`);
    } catch (error) {
      await this.markNotificationAsFailed(notification.id, error.message);
      this.logger.error(
        `Failed to send notification: ${notification.id}`,
        error.stack,
      );
    }
  }

  private async markNotificationAsSent(notificationId: number) {
    await this.notificationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        await transactionalEntityManager.update(
          Notification,
          { id: notificationId, status: NotificationStatus.PROCESSING },
          {
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        );
      },
    );
  }

  private async markNotificationAsFailed(
    notificationId: number,
    errorMessage: string,
  ) {
    await this.notificationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const notification = await transactionalEntityManager.findOne(
          Notification,
          {
            where: {
              id: notificationId,
              status: NotificationStatus.PROCESSING,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          },
        );

        if (notification) {
          notification.status = NotificationStatus.FAILED;
          notification.errorMessage = errorMessage;
          notification.retryCount += 1;
          await transactionalEntityManager.save(notification);
        }
      },
    );
  }

  async retryFailedNotifications() {
    await this.notificationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const failedNotifications = await transactionalEntityManager
          .createQueryBuilder(Notification, 'notification')
          .setLock('pessimistic_write')
          .where({
            status: NotificationStatus.FAILED,
            retryCount: LessThan(3),
          })
          .getMany();

        if (failedNotifications.length > 0) {
          const notificationIds = failedNotifications.map((n) => n.id);
          await transactionalEntityManager.update(
            Notification,
            { id: In(notificationIds) },
            { status: NotificationStatus.PENDING },
          );
        }
      },
    );
  }
}
