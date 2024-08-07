import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from './common/guards/api-key.guard';

@Controller()
@UseGuards(ApiKeyGuard)
export class AppController {
  constructor() {}

  @Get()
  async index() {
    return 'Hello World!';
  }
}
