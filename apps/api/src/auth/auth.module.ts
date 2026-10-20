import { Module } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseAuthService } from './firebase-auth.service';

@Module({
  providers: [FirebaseAuthGuard, FirebaseAuthService],
  exports: [FirebaseAuthGuard, FirebaseAuthService],
})
export class AuthModule {}
