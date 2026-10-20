import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { RolesGuard } from '../auth/roles.guard';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [ModerationController],
  providers: [ModerationService, RolesGuard],
})
export class ModerationModule {}
