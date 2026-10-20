import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import type { ApiHealthResponse } from '@dahamiz/shared-types';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns service health status' })
  @ApiOkResponse({ description: 'Service is healthy' })
  check(): ApiHealthResponse {
    return {
      status: 'ok',
      version: process.env['npm_package_version'] ?? '0.0.1',
      environment: process.env['NODE_ENV'] ?? 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
