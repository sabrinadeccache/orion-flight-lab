import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SgqService } from './sgq.service';
import { CreateAuditProgramDto } from './dto/create-audit-program.dto';
import { CreateAuditDto } from './dto/create-audit.dto';
import { CreateNonConformityDto } from './dto/create-non-conformity.dto';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';

@Controller('sgq')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class SgqController {
  constructor(private readonly sgqService: SgqService) {}

  @Post('audit-programs')
  @AuditLog({ action: 'create', entity: 'AuditProgram' })
  createAuditProgram(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAuditProgramDto) {
    return this.sgqService.createAuditProgram(user.organizationId, dto);
  }

  @Get('audit-programs')
  findAuditPrograms(@CurrentUser() user: AuthenticatedUser) {
    return this.sgqService.findAuditPrograms(user.organizationId);
  }

  @Post('audits')
  @AuditLog({ action: 'create', entity: 'Audit' })
  createAudit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAuditDto) {
    return this.sgqService.createAudit(user.organizationId, dto);
  }

  @Get('audits')
  findAudits(@CurrentUser() user: AuthenticatedUser) {
    return this.sgqService.findAudits(user.organizationId);
  }

  @Post('non-conformities')
  @AuditLog({ action: 'create', entity: 'NonConformity' })
  createNonConformity(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNonConformityDto) {
    return this.sgqService.createNonConformity(user.organizationId, dto);
  }

  @Get('non-conformities')
  findNonConformities(@CurrentUser() user: AuthenticatedUser) {
    return this.sgqService.findNonConformities(user.organizationId);
  }

  @Patch('non-conformities/:id/close')
  @AuditLog({ action: 'update', entity: 'NonConformity' })
  closeNonConformity(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sgqService.closeNonConformity(user.organizationId, id);
  }

  @Post('corrective-actions')
  @AuditLog({ action: 'create', entity: 'CorrectiveAction' })
  createCorrectiveAction(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCorrectiveActionDto,
  ) {
    return this.sgqService.createCorrectiveAction(user.organizationId, dto);
  }

  @Patch('corrective-actions/:id/complete')
  @AuditLog({ action: 'update', entity: 'CorrectiveAction' })
  completeCorrectiveAction(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.sgqService.completeCorrectiveAction(user.organizationId, id);
  }
}
