import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('email')
@UseGuards(ApiKeyGuard)
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendEmail(
    @Body('to') to: string,
    @Body('subject') subject: string,
    @Body('html') html: string,
  ) {
    await this.emailService.sendEmail(to, subject, html);

    return { message: 'Email sent successfully' };
  }
}
