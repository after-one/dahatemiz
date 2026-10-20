import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MediaModule } from '../media/media.module';
import { RolesGuard } from '../auth/roles.guard';
import { GovernmentController } from './government.controller';
import { GovernmentService } from './government.service';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [GovernmentController],
  providers: [GovernmentService, RolesGuard],
})
export class GovernmentModule {}
