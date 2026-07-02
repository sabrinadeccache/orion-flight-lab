import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { SgsoService } from './sgso.service';
import { CreateHazardDto } from './dto/create-hazard.dto';
import { CreateRiskDto } from './dto/create-risk.dto';
import { CreateMitigationDto } from './dto/create-mitigation.dto';
import { CreateSafetyOccurrenceDto } from './dto/create-safety-occurrence.dto';

@Controller('sgso')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class SgsoController {
  constructor(private readonly sgsoService: SgsoService) {}

  @Post('hazards')
  @AuditLog({ action: 'create', entity: 'Hazard' })
  createHazard(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHazardDto) {
    return this.sgsoService.createHazard(user.organizationId, dto);
  }

  @Get('hazards')
  findHazards(@CurrentUser() user: AuthenticatedUser) {
    return this.sgsoService.findHazards(user.organizationId);
  }

  @Post('risks')
  @AuditLog({ action: 'create', entity: 'Risk' })
  createRisk(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRiskDto) {
    return this.sgsoService.createRisk(user.organizationId, dto);
  }

  @Get('risks')
  findRisks(@CurrentUser() user: AuthenticatedUser) {
    return this.sgsoService.findRisks(user.organizationId);
  }

  @Post('mitigations')
  @AuditLog({ action: 'create', entity: 'Mitigation' })
  createMitigation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMitigationDto) {
    return this.sgsoService.createMitigation(user.organizationId, dto);
  }

  @Post('safety-occurrences')
  @AuditLog({ action: 'create', entity: 'SafetyOccurrence' })
  createSafetyOccurrence(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSafetyOccurrenceDto,
  ) {
    return this.sgsoService.createSafetyOccurrence(user.organizationId, dto);
  }

  @Get('safety-occurrences')
  findSafetyOccurrences(@CurrentUser() user: AuthenticatedUser) {
    return this.sgsoService.findSafetyOccurrences(user.organizationId);
  }
}
