import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScrapersModule } from './scrapers/scrapers.module';
import { EmailModule } from './email/email.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';
import { S3Module } from './s3/s3.module';
import { S3CertificatesService } from './s3/s3-certificates.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        `.env.${process.env.NODE_ENV}`,
        `.env.${process.env.NODE_ENV}.local`,
      ],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule, S3Module],
      inject: [ConfigService, S3CertificatesService],
      useFactory: async (
        configService: ConfigService,
        s3CertificatesService: S3CertificatesService,
      ) => {
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';
        let sslCert: string | undefined;

        if (isProduction) {
          const bucket = configService.get<string>('SSL_CERTIFICATE_S3_BUCKET');
          const key = configService.get<string>('SSL_CERTIFICATE_S3_KEY');
          if (bucket && key) {
            sslCert = await s3CertificatesService.getCertificateFromS3(
              bucket,
              key,
            );
          } else {
            console.warn('SSL certificate S3 bucket or key is not provided');
          }
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST'),
          port: configService.get<number>('DATABASE_PORT'),
          username: configService.get<string>('DATABASE_USER'),
          password: configService.get<string>('DATABASE_PASSWORD'),
          database: configService.get<string>('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: configService.get<boolean>(
            'DATABASE_SYNCHRONIZE',
            !isProduction,
          ),
          logging: configService.get<boolean>(
            'DATABASE_LOGGING',
            !isProduction,
          ),
          ...(isProduction &&
            sslCert && {
              ssl: {
                ca: sslCert,
              },
            }),
        };
      },
    }),
    ScrapersModule,
    EmailModule,
    NotificationsModule,
    SubscriptionsModule,
    CommonModule,
    S3Module,
  ],
  controllers: [AppController],
})
export class AppModule {}
