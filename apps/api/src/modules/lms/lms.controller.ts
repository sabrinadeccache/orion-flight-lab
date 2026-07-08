import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@orion/shared';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { LmsService } from './lms.service';
import { MarkLessonProgressDto } from './dto/mark-lesson-progress.dto';

/** Staff roles allowed to see a course's progress dashboard. */
const PROGRESS_VIEWER_ROLES = [Role.ADMIN, Role.COORDENADOR_ACADEMICO, Role.INSTRUTOR];

@Controller('lms')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class LmsController {
  constructor(private readonly lmsService: LmsService) {}

  @Get('my-enrollments')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  getMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.lmsService.getMyEnrollments(user.organizationId, user.id);
  }

  @Get('enrollments/:id/content')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  getEnrollmentContent(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.getEnrollmentContent(user.organizationId, user.id, id);
  }

  @Post('lessons/:id/progress')
  @UseGuards(RolesGuard)
  @Roles(Role.ALUNO)
  @AuditLog({ action: 'update', entity: 'LessonProgress' })
  markLessonProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MarkLessonProgressDto,
  ) {
    return this.lmsService.markLessonProgress(user.organizationId, user.id, id, dto);
  }

  @Get('courses/:id/progress')
  @UseGuards(RolesGuard)
  @Roles(...PROGRESS_VIEWER_ROLES)
  getCourseProgress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lmsService.getCourseProgress(user.organizationId, id);
  }
}
