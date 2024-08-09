/* eslint-disable @typescript-eslint/no-unused-vars */
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NotificationsService } from '../notifications/notifications.service';
import { Context, ScheduledEvent } from 'aws-lambda';

export const processNotifications = async (
  event: ScheduledEvent,
  context: Context,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);

  await notificationsService.processNotifications();

  await app.close();
};

export const retryFailedNotifications = async (
  event: ScheduledEvent,
  context: Context,
) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);

  await notificationsService.retryFailedNotifications();

  await app.close();
};
