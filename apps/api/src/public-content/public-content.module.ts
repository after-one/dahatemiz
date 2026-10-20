import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { PublicContentController } from './public-content.controller';
import { PublicContentService } from './public-content.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [PublicContentController],
  providers: [PublicContentService],
  exports: [PublicContentService],
})
export class PublicContentModule {}
