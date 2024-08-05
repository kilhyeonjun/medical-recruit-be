import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | undefined;
  private isProduction: boolean;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.transporter = this.isProduction ? this.createTransporter() : undefined;
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      service: this.configService.get<string>('SMTP_SERVICE'),
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: this.configService.get<boolean>('SMTP_SECURE'),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  private logMockEmail(to: string, subject: string, html: string): void {
    this.logger.log(`
      [MOCK EMAIL]
      To: ${to}
      Subject: ${subject}
      Content: ${html}
    `);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!this.isProduction) {
        this.logMockEmail(to, subject, html);

        return;
      }

      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }
}
