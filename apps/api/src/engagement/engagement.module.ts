import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/roles.guard';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

@Module({
  imports: [AuthModule],
  controllers: [EngagementController],
  providers: [EngagementService, RolesGuard],
})
export class EngagementModule {}
