import { ReportStatus } from '@dahamiz/shared-types';
import { IsEnum, IsIn, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  city!: string;
}

export class AddOrganizationMemberDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  firebaseUid!: string;

  @IsIn(['ORG_ADMIN', 'OFFICER'])
  role!: 'ORG_ADMIN' | 'OFFICER';
}

export class AssignCaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  firebaseUid!: string;
}

export class UpdateCaseStatusDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;
}

export class AddCaseNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}

export class EvidenceAccessDto {
  @IsUUID('4')
  uploadId!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(500)
  purpose!: string;
}
