import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationService } from './notification.service';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Processing notifications');
    await this.notificationService.processNotifications();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedNotifications() {
    this.logger.debug('Retrying failed notifications');
    await this.notificationService.retryFailedNotifications();
  }
}
