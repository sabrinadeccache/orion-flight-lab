import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  Course,
  Curriculum,
  Lesson,
  Material,
  Module as ModuleEntity,
  Segment,
  SubUnit,
  TrainingProgram,
  Unit,
} from '@prisma/client';
import { Role } from '@orion/shared';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { TrainingService } from './training.service';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { CreateSubUnitDto } from './dto/create-sub-unit.dto';
import { UpdateSubUnitDto } from './dto/update-sub-unit.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

/** Roles allowed to author course content (Segment through Material). */
const CONTENT_AUTHOR_ROLES = [Role.ADMIN, Role.COORDENADOR_ACADEMICO, Role.INSTRUTOR];

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

  // ---------------------------------------------------------------------
  // Segment
  // ---------------------------------------------------------------------

  @Get('courses/:courseId/segments')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findSegmentsByCourse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('courseId') courseId: string,
  ): Promise<Segment[]> {
    return this.trainingService.findSegmentsByCourse(user.organizationId, courseId);
  }

  @Post('segments')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'Segment' })
  createSegment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSegmentDto,
  ): Promise<Segment> {
    return this.trainingService.createSegment(user.organizationId, dto);
  }

  @Get('segments/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findSegment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Segment> {
    return this.trainingService.findSegment(user.organizationId, id);
  }

  @Patch('segments/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'Segment' })
  updateSegment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSegmentDto,
  ): Promise<Segment> {
    return this.trainingService.updateSegment(user.organizationId, id, dto);
  }

  @Delete('segments/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'Segment' })
  deleteSegment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteSegment(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // Module
  // ---------------------------------------------------------------------

  @Get('segments/:segmentId/modules')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findModulesBySegment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('segmentId') segmentId: string,
  ): Promise<ModuleEntity[]> {
    return this.trainingService.findModulesBySegment(user.organizationId, segmentId);
  }

  @Post('modules')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'Module' })
  createModule(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateModuleDto,
  ): Promise<ModuleEntity> {
    return this.trainingService.createModule(user.organizationId, dto);
  }

  @Get('modules/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findModule(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<ModuleEntity> {
    return this.trainingService.findModule(user.organizationId, id);
  }

  @Patch('modules/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'Module' })
  updateModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateModuleDto,
  ): Promise<ModuleEntity> {
    return this.trainingService.updateModule(user.organizationId, id, dto);
  }

  @Delete('modules/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'Module' })
  deleteModule(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteModule(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // Unit
  // ---------------------------------------------------------------------

  @Get('modules/:moduleId/units')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findUnitsByModule(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduleId') moduleId: string,
  ): Promise<Unit[]> {
    return this.trainingService.findUnitsByModule(user.organizationId, moduleId);
  }

  @Post('units')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'Unit' })
  createUnit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUnitDto): Promise<Unit> {
    return this.trainingService.createUnit(user.organizationId, dto);
  }

  @Get('units/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findUnit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Unit> {
    return this.trainingService.findUnit(user.organizationId, id);
  }

  @Patch('units/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'Unit' })
  updateUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ): Promise<Unit> {
    return this.trainingService.updateUnit(user.organizationId, id, dto);
  }

  @Delete('units/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'Unit' })
  deleteUnit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteUnit(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // SubUnit
  // ---------------------------------------------------------------------

  @Get('units/:unitId/sub-units')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findSubUnitsByUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('unitId') unitId: string,
  ): Promise<SubUnit[]> {
    return this.trainingService.findSubUnitsByUnit(user.organizationId, unitId);
  }

  @Post('sub-units')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'SubUnit' })
  createSubUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubUnitDto,
  ): Promise<SubUnit> {
    return this.trainingService.createSubUnit(user.organizationId, dto);
  }

  @Get('sub-units/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findSubUnit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<SubUnit> {
    return this.trainingService.findSubUnit(user.organizationId, id);
  }

  @Patch('sub-units/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'SubUnit' })
  updateSubUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubUnitDto,
  ): Promise<SubUnit> {
    return this.trainingService.updateSubUnit(user.organizationId, id, dto);
  }

  @Delete('sub-units/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'SubUnit' })
  deleteSubUnit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteSubUnit(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // Lesson
  // ---------------------------------------------------------------------

  @Get('sub-units/:subUnitId/lessons')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findLessonsBySubUnit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('subUnitId') subUnitId: string,
  ): Promise<Lesson[]> {
    return this.trainingService.findLessonsBySubUnit(user.organizationId, subUnitId);
  }

  @Post('lessons')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'Lesson' })
  createLesson(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLessonDto): Promise<Lesson> {
    return this.trainingService.createLesson(user.organizationId, dto);
  }

  @Get('lessons/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findLesson(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Lesson> {
    return this.trainingService.findLesson(user.organizationId, id);
  }

  @Patch('lessons/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'Lesson' })
  updateLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
  ): Promise<Lesson> {
    return this.trainingService.updateLesson(user.organizationId, id, dto);
  }

  @Delete('lessons/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'Lesson' })
  deleteLesson(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteLesson(user.organizationId, id);
  }

  // ---------------------------------------------------------------------
  // Material
  // ---------------------------------------------------------------------

  @Get('lessons/:lessonId/materials')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findMaterialsByLesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param('lessonId') lessonId: string,
  ): Promise<Material[]> {
    return this.trainingService.findMaterialsByLesson(user.organizationId, lessonId);
  }

  @Post('materials')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'create', entity: 'Material' })
  createMaterial(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMaterialDto,
  ): Promise<Material> {
    return this.trainingService.createMaterial(user.organizationId, dto);
  }

  @Get('materials/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard)
  findMaterial(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<Material> {
    return this.trainingService.findMaterial(user.organizationId, id);
  }

  @Patch('materials/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'update', entity: 'Material' })
  updateMaterial(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
  ): Promise<Material> {
    return this.trainingService.updateMaterial(user.organizationId, id, dto);
  }

  @Delete('materials/:id')
  @UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
  @Roles(...CONTENT_AUTHOR_ROLES)
  @AuditLog({ action: 'delete', entity: 'Material' })
  deleteMaterial(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.trainingService.deleteMaterial(user.organizationId, id);
  }
}
