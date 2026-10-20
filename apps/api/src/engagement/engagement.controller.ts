import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dahamiz/shared-types';
import type { Request } from 'express';
import { authenticatedUser, FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import type { AuthenticatedUser } from '../auth/auth.types';
import {
  CreateCommunityEventDto,
  CreateCommunityTeamDto,
  EngagementPreferencesDto,
} from './engagement.dto';
// Nest reads this class at runtime to attach the correct ValidationPipe metatype.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { LeaderboardQueryDto } from './engagement.dto';
import { EngagementService } from './engagement.service';

@ApiTags('engagement')
@Controller('engagement')
export class EngagementController {
  constructor(@Inject(EngagementService) private readonly engagement: EngagementService) {}

  @Get('leaderboard')
  leaderboard(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: LeaderboardQueryDto,
  ) {
    return this.engagement.leaderboard(query);
  }

  @Get('teams/leaderboard')
  teamLeaderboard(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: LeaderboardQueryDto,
  ) {
    return this.engagement.teamLeaderboard(query);
  }

  @Get('events')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  events(@Req() request: Request) {
    return this.engagement.listEvents(authenticatedUser(request));
  }

  @Get('teams')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  teams(
    @Req() request: Request,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    query: LeaderboardQueryDto,
  ) {
    return this.engagement.listTeams(authenticatedUser(request), query);
  }

  @Post('teams')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  createTeam(
    @Req() request: Request,
    @Body(
      new ValidationPipe({
        expectedType: CreateCommunityTeamDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: CreateCommunityTeamDto,
  ) {
    return this.engagement.createTeam(authenticatedUser(request), input);
  }

  @Post('teams/:id/join')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  joinTeam(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) teamId: string,
  ) {
    return this.engagement.joinTeam(authenticatedUser(request), teamId);
  }

  @Post('teams/:id/leave')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  leaveTeam(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) teamId: string,
  ) {
    return this.engagement.leaveTeam(authenticatedUser(request), teamId);
  }

  @Post('events')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  createEvent(
    @Req() request: Request,
    @Body(
      new ValidationPipe({
        expectedType: CreateCommunityEventDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: CreateCommunityEventDto,
  ) {
    return this.engagement.createEvent(authenticatedUser(request), input);
  }

  @Get('events/:id/participants')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  participants(@Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string) {
    return this.engagement.listParticipants(eventId);
  }

  @Post('events/:id/join')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  join(@Req() request: Request, @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string) {
    return this.engagement.joinEvent(
      authenticatedUser(request),
      eventId,
      (request as Request & { requestId?: string }).requestId,
    );
  }

  @Post('events/:id/cancel')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  cancel(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string,
  ) {
    return this.engagement.cancelRsvp(authenticatedUser(request), eventId);
  }

  @Post('events/:id/check-ins/:participantId')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  verifyAttendance(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Param('participantId', new ParseUUIDPipe({ version: '4' })) participantId: string,
  ) {
    return this.engagement.verifyAttendance(
      authenticatedUser(request),
      eventId,
      participantId,
      (request as Request & { requestId?: string }).requestId,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  summary(@Req() request: Request) {
    return this.engagement.getSummary(authenticatedUser(request));
  }

  @Get('preferences')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  preferences(@Req() request: Request) {
    return this.engagement.getPreferences(authenticatedUser(request));
  }

  @Patch('preferences')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  updatePreferences(
    @Req() request: Request,
    @Body(
      new ValidationPipe({
        expectedType: EngagementPreferencesDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    input: EngagementPreferencesDto,
  ) {
    const user: AuthenticatedUser = authenticatedUser(request);
    return this.engagement.updatePreferences(
      user,
      input,
      (request as Request & { requestId?: string }).requestId,
    );
  }

  @Get('notifications')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  notifications(@Req() request: Request) {
    return this.engagement.listNotifications(authenticatedUser(request));
  }

  @Post('notifications/:id/read')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  markNotificationRead(
    @Req() request: Request,
    @Param('id', new ParseUUIDPipe({ version: '4' })) notificationId: string,
  ) {
    return this.engagement.markNotificationRead(authenticatedUser(request), notificationId);
  }
}
