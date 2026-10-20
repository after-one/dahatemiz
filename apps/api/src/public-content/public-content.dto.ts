import {
  IncidentCategory,
  PublicContentReportReason,
  PublicContentReportStatus,
} from '@dahamiz/shared-types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PublicContentQueryDto {
  @IsOptional()
  @IsEnum(IncidentCategory)
  category?: IncidentCategory;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;
}

export class PublicFeedQueryDto extends PublicContentQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 20;
}

export class CreatePublicContentReportDto {
  @IsEnum(PublicContentReportReason)
  reason!: PublicContentReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string;
}

export class ContentReportsQueryDto {
  @IsOptional()
  @IsEnum(PublicContentReportStatus)
  status?: PublicContentReportStatus;
}
