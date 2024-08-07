import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './common/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class AppController {
  constructor() {}

  @Get('/hello')
  async index() {
    return 'Hello World!';
  }
}
