import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dahamiz/shared-types';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/auth.types';
import { authenticatedUser, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ContentReportsQueryDto } from '../public-content/public-content.dto';
import { ModerationService } from './moderation.service';
import { PublishReportDto, ReviewContentReportDto, ReviewReportDto } from './moderation.dto';

@ApiTags('moderation')
@ApiBearerAuth()
@Controller('moderation')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(UserRole.MODERATOR, UserRole.ADMIN)
export class ModerationController {
  constructor(@Inject(ModerationService) private readonly moderation: ModerationService) {}

  @Get('reports')
  listReportsForReview(@Req() request: Request) {
    return this.moderation.listReportsForReview(authenticatedUser(request));
  }

  @Post('reports/:id/review')
  reviewReport(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) reportId: string,
    @Body(
      new ValidationPipe({
        expectedType: ReviewReportDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: ReviewReportDto,
  ) {
    return this.moderation.reviewReport(authenticatedUser(request), reportId, input);
  }

  @Post('reports/:id/publish')
  publish(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) reportId: string,
    @Body(
      new ValidationPipe({
        expectedType: PublishReportDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: PublishReportDto,
  ) {
    return this.moderation.publishReport(authenticatedUser(request), reportId, input);
  }

  @Get('content-reports')
  listContentReports(
    @Query(
      new ValidationPipe({
        expectedType: ContentReportsQueryDto,
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    query: ContentReportsQueryDto,
  ) {
    return this.moderation.listContentReports(query.status);
  }

  @Post('content-reports/:id/review')
  review(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) reportId: string,
    @Body(
      new ValidationPipe({
        expectedType: ReviewContentReportDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: ReviewContentReportDto,
  ) {
    const user: AuthenticatedUser = authenticatedUser(request);
    return this.moderation.reviewContentReport(user, reportId, input);
  }
}
