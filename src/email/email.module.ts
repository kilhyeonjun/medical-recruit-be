import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './\bemail.controller';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
