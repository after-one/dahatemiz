import { IsBoolean, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunityEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  description!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @IsISO8601()
  startsAt!: string;
}

export class EngagementPreferencesDto {
  @IsBoolean()
  inAppNotificationsEnabled!: boolean;

  @IsBoolean()
  pushNotificationsEnabled!: boolean;

  @IsBoolean()
  leaderboardOptIn!: boolean;
}

export class LeaderboardQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;
}

export class CreateCommunityTeamDto {
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  description!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;
}
