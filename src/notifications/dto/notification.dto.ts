import { PickType } from '@nestjs/mapped-types';
import { NotificationEntity } from '../entities/notifications.entity';

export class CreateNotificationDto extends PickType(NotificationEntity, [
  'type',
  'recipient',
  'content',
  'jobPostId',
] as const) {}

export type NotificationContent = {
  subject: string;
  html: string;
};
