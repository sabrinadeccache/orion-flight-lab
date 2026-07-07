import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Course, Curriculum, TrainingProgram } from '@prisma/client';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TrainingService } from './training.service';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.trainingService.name() };
  }

  @Post('programs')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  @AuditLog({ action: 'create', entity: 'TrainingProgram' })
  createProgram(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTrainingProgramDto,
  ): Promise<TrainingProgram> {
    return this.trainingService.createTrainingProgram(user.organizationId, dto);
  }

  @Get('programs')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findPrograms(@CurrentUser() user: AuthenticatedUser): Promise<TrainingProgram[]> {
    return this.trainingService.findTrainingPrograms(user.organizationId);
  }

  @Post('curricula')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  @AuditLog({ action: 'create', entity: 'Curriculum' })
  createCurriculum(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCurriculumDto,
  ): Promise<Curriculum> {
    return this.trainingService.createCurriculum(user.organizationId, dto);
  }

  @Get('curricula')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findCurricula(@CurrentUser() user: AuthenticatedUser): Promise<Curriculum[]> {
    return this.trainingService.findCurricula(user.organizationId);
  }

  @Post('courses')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  @AuditLog({ action: 'create', entity: 'Course' })
  createCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ): Promise<Course> {
    return this.trainingService.createCourse(user.organizationId, dto);
  }

  @Get('courses')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findCourses(@CurrentUser() user: AuthenticatedUser): Promise<Course[]> {
    return this.trainingService.findCourses(user.organizationId);
  }

  @Get('courses/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findCourse(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Course> {
    return this.trainingService.findCourse(user.organizationId, id);
  }

  @Patch('courses/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  @AuditLog({ action: 'update', entity: 'Course' })
  updateCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<Course> {
    return this.trainingService.updateCourse(user.organizationId, id, dto);
  }

  @Delete('courses/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  @AuditLog({ action: 'delete', entity: 'Course' })
  deleteCourse(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteCourse(user.organizationId, id);
  }
}
