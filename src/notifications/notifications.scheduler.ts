import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Processing notifications');
    await this.notificationsService.processNotifications();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async retryFailedNotifications() {
    this.logger.debug('Retrying failed notifications');
    await this.notificationsService.retryFailedNotifications();
  }
}
