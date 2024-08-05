import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';
import { Notification } from './entities/notification.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notification]), EmailModule],
  providers: [NotificationService, NotificationScheduler],
  exports: [NotificationService],
})
export class NotificationsModule {}
