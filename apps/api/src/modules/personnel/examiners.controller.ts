import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PersonnelService } from './personnel.service';
import { CreateExaminerDto } from './dto/create-examiner.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';

@Controller('personnel/examiners')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class ExaminersController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Examiner' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExaminerDto) {
    return this.personnelService.createExaminer(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.personnelService.findExaminers(user.organizationId);
  }

  @Post(':id/qualifications')
  @AuditLog({ action: 'create', entity: 'AircraftQualification' })
  addQualification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateQualificationDto,
  ) {
    return this.personnelService.addExaminerQualification(user.organizationId, id, dto);
  }
}
