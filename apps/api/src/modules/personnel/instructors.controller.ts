import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PersonnelService } from './personnel.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';
import { CreateCmaDto } from './dto/create-cma.dto';
import { CreateProficiencyDto } from './dto/create-proficiency.dto';
import { CreateLessonLogDto } from './dto/create-lesson-log.dto';
import { ExpiringQualificationsQueryDto } from '../academic/dto/expiring-qualifications-query.dto';

@Controller('personnel/instructors')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class InstructorsController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Instructor' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInstructorDto) {
    return this.personnelService.createInstructor(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.personnelService.findInstructors(user.organizationId);
  }

  @Get('cma/expiring')
  cmaExpiring(@CurrentUser() user: AuthenticatedUser, @Query() query: ExpiringQualificationsQueryDto) {
    return this.personnelService.getExpiringCmas(user.organizationId, query.days ?? 30);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.personnelService.findInstructor(user.organizationId, id);
  }

  @Patch(':id')
  @AuditLog({ action: 'update', entity: 'Instructor' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInstructorDto,
  ) {
    return this.personnelService.updateInstructor(user.organizationId, id, dto);
  }

  @Delete(':id')
  @AuditLog({ action: 'delete', entity: 'Instructor' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.personnelService.deleteInstructor(user.organizationId, id);
  }

  @Post(':id/qualifications')
  @AuditLog({ action: 'create', entity: 'AircraftQualification' })
  addQualification(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateQualificationDto,
  ) {
    return this.personnelService.addInstructorQualification(user.organizationId, id, dto);
  }

  @Post(':id/cma')
  @AuditLog({ action: 'create', entity: 'CMA' })
  addCma(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateCmaDto) {
    return this.personnelService.addCma(user.organizationId, id, dto);
  }

  @Post(':id/proficiencies')
  @AuditLog({ action: 'create', entity: 'Proficiency' })
  addProficiency(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateProficiencyDto,
  ) {
    return this.personnelService.addProficiency(user.organizationId, id, dto);
  }

  @Post(':id/lessons')
  @AuditLog({ action: 'create', entity: 'InstructorLessonLog' })
  registerLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateLessonLogDto,
  ) {
    return this.personnelService.registerLessonLog(user.organizationId, id, dto);
  }
}
