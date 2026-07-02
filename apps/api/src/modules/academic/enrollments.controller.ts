import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Enrollment } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Controller('enrollments')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class EnrollmentsController {
  constructor(private readonly academicService: AcademicService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Enrollment' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateEnrollmentDto,
  ): Promise<Enrollment> {
    return this.academicService.createEnrollment(user.organizationId, dto);
  }
}
