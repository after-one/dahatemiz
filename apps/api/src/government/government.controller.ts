import {
  Body,
  Controller,
  Get,
  Header,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import {
  AddCaseNoteDto,
  AddOrganizationMemberDto,
  AssignCaseDto,
  CreateOrganizationDto,
  EvidenceAccessDto,
  UpdateCaseStatusDto,
} from './government.dto';
import { GovernmentService } from './government.service';

@ApiTags('government')
@ApiBearerAuth()
@Controller('government')
@UseGuards(FirebaseAuthGuard)
export class GovernmentController {
  constructor(@Inject(GovernmentService) private readonly government: GovernmentService) {}

  @Get('organizations')
  listOrganizations(@Req() request: Request) {
    return this.government.listOrganizations(authenticatedUser(request));
  }

  @Get('available-organizations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  listAvailableOrganizations() {
    return this.government.listAvailableOrganizations();
  }

  @Post('organizations')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createOrganization(
    @Req() request: Request,
    @Body(
      new ValidationPipe({
        expectedType: CreateOrganizationDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: CreateOrganizationDto,
  ) {
    return this.government.createOrganization(authenticatedUser(request), body);
  }

  @Post('organizations/:organizationId/members')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  addOrganizationMember(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Body(
      new ValidationPipe({
        expectedType: AddOrganizationMemberDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: AddOrganizationMemberDto,
  ) {
    return this.government.addOrganizationMember(authenticatedUser(request), organizationId, body);
  }

  @Post('organizations/:organizationId/reports/:reportId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  forwardCase(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Param('reportId', new ParseUUIDPipe({ version: '4' })) reportId: string,
  ) {
    return this.government.forwardCase(authenticatedUser(request), organizationId, reportId);
  }

  @Get('organizations/:organizationId/cases')
  listCases(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
  ) {
    return this.government.listCases(authenticatedUser(request), organizationId);
  }

  @Get('organizations/:organizationId/cases-export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="dahamiz-cases.csv"')
  exportCases(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
  ) {
    return this.government.exportCases(authenticatedUser(request), organizationId);
  }

  @Get('organizations/:organizationId/cases/:caseId')
  getCase(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Param('caseId', new ParseUUIDPipe({ version: '4' })) caseId: string,
  ) {
    return this.government.getCase(authenticatedUser(request), organizationId, caseId);
  }

  @Post('organizations/:organizationId/cases/:caseId/assignment')
  assignCase(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Param('caseId', new ParseUUIDPipe({ version: '4' })) caseId: string,
    @Body(
      new ValidationPipe({
        expectedType: AssignCaseDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: AssignCaseDto,
  ) {
    return this.government.assignCase(authenticatedUser(request), organizationId, caseId, body);
  }

  @Post('organizations/:organizationId/cases/:caseId/notes')
  addNote(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Param('caseId', new ParseUUIDPipe({ version: '4' })) caseId: string,
    @Body(
      new ValidationPipe({
        expectedType: AddCaseNoteDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: AddCaseNoteDto,
  ) {
    return this.government.addNote(authenticatedUser(request), organizationId, caseId, body);
  }

  @Patch('organizations/:organizationId/cases/:caseId/status')
  updateStatus(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Param('caseId', new ParseUUIDPipe({ version: '4' })) caseId: string,
    @Body(
      new ValidationPipe({
        expectedType: UpdateCaseStatusDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: UpdateCaseStatusDto,
  ) {
    return this.government.updateCaseStatus(
      authenticatedUser(request),
      organizationId,
      caseId,
      body,
    );
  }

  @Post('organizations/:organizationId/cases/:caseId/evidence-access')
  evidenceAccess(
    @Req() request: Request,
    @Param('organizationId', new ParseUUIDPipe({ version: '4' })) organizationId: string,
    @Param('caseId', new ParseUUIDPipe({ version: '4' })) caseId: string,
    @Body(
      new ValidationPipe({
        expectedType: EvidenceAccessDto,
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: EvidenceAccessDto,
  ) {
    return this.government.createEvidenceReadUrl(
      authenticatedUser(request),
      organizationId,
      caseId,
      body,
      (request as Request & { requestId?: string }).requestId,
    );
  }
}
