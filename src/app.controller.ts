import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get('/hello')
  async index() {
    return 'Hello World!';
  }
}
