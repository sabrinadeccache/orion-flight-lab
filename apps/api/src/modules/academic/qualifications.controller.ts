import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { ExpiringQualificationsQueryDto } from './dto/expiring-qualifications-query.dto';

@Controller('qualifications')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class QualificationsController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('expiring')
  expiring(@CurrentUser() user: AuthenticatedUser, @Query() query: ExpiringQualificationsQueryDto) {
    return this.academicService.getExpiringQualifications(user.organizationId, query.days ?? 30);
  }
}
