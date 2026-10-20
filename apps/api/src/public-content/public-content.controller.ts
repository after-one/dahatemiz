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
import type { Request } from 'express';
import { FirebaseAuthGuard, authenticatedUser } from '../auth/firebase-auth.guard';
// Nest reads these classes at runtime to attach the correct ValidationPipe metatype.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import {
  CreatePublicContentReportDto,
  PublicContentQueryDto,
  PublicFeedQueryDto,
} from './public-content.dto';
import { PublicContentService } from './public-content.service';

@ApiTags('public-content')
@Controller('public')
export class PublicContentController {
  constructor(@Inject(PublicContentService) private readonly content: PublicContentService) {}

  @Get('feed')
  feed(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: PublicFeedQueryDto,
  ) {
    return this.content.listFeed(query);
  }

  @Get('map')
  map(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: PublicContentQueryDto,
  ) {
    return this.content.listMapMarkers(query);
  }

  @Post('posts/:id/reports')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  reportPost(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) postId: string,
    @Body(
      new ValidationPipe({
        expectedType: CreatePublicContentReportDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: CreatePublicContentReportDto,
  ) {
    return this.content.reportContent(
      authenticatedUser(request),
      postId,
      input,
      (request as Request & { requestId?: string }).requestId,
    );
  }
}
