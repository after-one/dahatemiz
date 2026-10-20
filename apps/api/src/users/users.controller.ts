import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { FirebaseAuthGuard, authenticatedUser } from '../auth/firebase-auth.guard';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UsersController {
  @Get('me')
  me(@Req() request: Request) {
    const user = authenticatedUser(request);
    return { id: user.uid, email: user.email, displayName: user.displayName, role: user.role };
  }
}
