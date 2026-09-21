import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      success: true,
      status: 'ok',
      service: 'rivo-api',
      timestamp: new Date().toISOString(),
    };
  }
}
