import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('General')
@ApiBearerAuth()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Get hello greeting',
    description:
      'Returns a simple greeting message to verify that the API service is up and running.',
  })
  @ApiOkResponse({
    type: String,
    description: 'Greeting message successfully returned.',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
