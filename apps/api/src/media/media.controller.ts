import { Body, Controller, Inject, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { FirebaseAuthGuard, authenticatedUser } from '../auth/firebase-auth.guard';
import { CreateUploadDto } from './upload.dto';
import { MediaService } from './media.service';

@ApiTags('media')
@ApiBearerAuth()
@Controller('media')
@UseGuards(FirebaseAuthGuard)
export class MediaController {
  constructor(@Inject(MediaService) private readonly media: MediaService) {}

  @Post('upload-authorizations')
  authorizeUpload(
    @Req() request: Request,
    @Body(
      new ValidationPipe({
        expectedType: CreateUploadDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: CreateUploadDto,
  ) {
    return this.media.createUploadAuthorization(
      authenticatedUser(request),
      input,
      (request as Request & { requestId?: string }).requestId,
    );
  }
}
