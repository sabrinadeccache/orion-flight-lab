import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Attendance } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Controller('attendance')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class AttendanceController {
  constructor(private readonly academicService: AcademicService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Attendance' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendanceDto,
  ): Promise<Attendance> {
    return this.academicService.registerAttendance(user.organizationId, dto);
  }
}
