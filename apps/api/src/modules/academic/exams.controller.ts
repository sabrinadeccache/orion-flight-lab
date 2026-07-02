import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AcademicService } from './academic.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Controller('exams')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class ExamsController {
  constructor(private readonly academicService: AcademicService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Exam' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) {
    return this.academicService.registerExam(user.organizationId, dto);
  }
}
