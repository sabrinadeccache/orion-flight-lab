import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { ExpiringQualificationsQueryDto } from './dto/expiring-qualifications-query.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';

@Controller('qualifications')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class QualificationsController {
  constructor(private readonly academicService: AcademicService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Qualification' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQualificationDto) {
    return this.academicService.createQualification(user.organizationId, dto);
  }

  @Get('expiring')
  expiring(@CurrentUser() user: AuthenticatedUser, @Query() query: ExpiringQualificationsQueryDto) {
    return this.academicService.getExpiringQualifications(user.organizationId, query.days ?? 30);
  }
}
