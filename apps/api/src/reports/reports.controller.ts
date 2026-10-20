import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { FirebaseAuthGuard, authenticatedUser } from '../auth/firebase-auth.guard';
import { CreateReportDto } from './report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(FirebaseAuthGuard)
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Post()
  create(
    @Req() request: Request,
    @Body(
      new ValidationPipe({
        expectedType: CreateReportDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: CreateReportDto,
  ) {
    return this.reports.create(
      authenticatedUser(request),
      input,
      (request as Request & { requestId?: string }).requestId,
    );
  }

  @Get()
  listMine(@Req() request: Request) {
    return this.reports.listMine(authenticatedUser(request));
  }

  @Get(':id')
  getMine(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) reportId: string,
  ) {
    return this.reports.getMine(authenticatedUser(request), reportId);
  }

  @Post(':id/withdraw')
  withdraw(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) reportId: string,
  ) {
    return this.reports.withdraw(
      authenticatedUser(request),
      reportId,
      (request as Request & { requestId?: string }).requestId,
    );
  }
}
