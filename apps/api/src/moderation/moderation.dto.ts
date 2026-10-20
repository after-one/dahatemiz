import { PublicContentReportStatus, ReportStatus } from '@dahamiz/shared-types';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class PublishReportDto {
  @IsString()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  derivativeObjectKey?: string;
}

export class ReviewContentReportDto {
  @IsIn([PublicContentReportStatus.DISMISSED, PublicContentReportStatus.ACTIONED])
  status!: PublicContentReportStatus.DISMISSED | PublicContentReportStatus.ACTIONED;
}

export class ReviewReportDto {
  @IsIn([ReportStatus.UNDER_REVIEW, ReportStatus.REJECTED])
  status!: ReportStatus.UNDER_REVIEW | ReportStatus.REJECTED;
}
