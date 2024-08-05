import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { NotificationEntity } from './entities/notifications.entity';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity]), EmailModule],
  providers: [NotificationsService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
