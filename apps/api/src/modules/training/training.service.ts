import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Course,
  Curriculum,
  Lesson,
  Material,
  MaterialType,
  Module as ModuleEntity,
  Segment,
  SubUnit,
  TrainingProgram,
  Unit,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
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

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  name(): string {
    return 'training';
  }

  createTrainingProgram(
    organizationId: string,
    dto: CreateTrainingProgramDto,
  ): Promise<TrainingProgram> {
    return this.prisma.trainingProgram.create({
      data: { organization_id: organizationId, ...dto },
    });
  }

  findTrainingPrograms(organizationId: string): Promise<TrainingProgram[]> {
    return this.prisma.trainingProgram.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
  }

  async createCurriculum(organizationId: string, dto: CreateCurriculumDto): Promise<Curriculum> {
    await this.assertExists(
      () =>
        this.prisma.trainingProgram.findFirst({
          where: { id: dto.training_program_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Training program',
    );
    return this.prisma.curriculum.create({
      data: { organization_id: organizationId, ...dto },
    });
  }

  findCurricula(organizationId: string): Promise<Curriculum[]> {
    return this.prisma.curriculum.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
  }

  async createCourse(organizationId: string, dto: CreateCourseDto): Promise<Course> {
    await this.assertExists(
      () =>
        this.prisma.curriculum.findFirst({
          where: { id: dto.curriculum_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Curriculum',
    );
    return this.prisma.course.create({
      data: {
        organization_id: organizationId,
        curriculum_id: dto.curriculum_id,
        name: dto.name,
        code: dto.code,
        modality: dto.modality,
        min_passing_score: dto.min_passing_score,
        max_students: dto.max_students,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
    });
  }

  findCourses(organizationId: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      orderBy: { name: 'asc' },
    });
  }

  async findCourse(organizationId: string, id: string): Promise<Course> {
    const course = await this.prisma.course.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async updateCourse(organizationId: string, id: string, dto: UpdateCourseDto): Promise<Course> {
    await this.findCourse(organizationId, id);
    return this.prisma.course.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        modality: dto.modality,
        min_passing_score: dto.min_passing_score,
        max_students: dto.max_students,
        start_date: dto.start_date ? new Date(dto.start_date) : undefined,
        end_date: dto.end_date ? new Date(dto.end_date) : undefined,
      },
    });
  }

  async deleteCourse(organizationId: string, id: string): Promise<void> {
    await this.findCourse(organizationId, id);
    await this.prisma.course.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  // ---------------------------------------------------------------------
  // Content hierarchy: Segment -> Module -> Unit -> SubUnit -> Lesson -> Material
  // ---------------------------------------------------------------------

  async createSegment(organizationId: string, dto: CreateSegmentDto): Promise<Segment> {
    await this.assertExists(
      () =>
        this.prisma.course.findFirst({
          where: { id: dto.course_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Course',
    );
    return this.prisma.segment.create({ data: { organization_id: organizationId, ...dto } });
  }

  findSegmentsByCourse(organizationId: string, courseId: string): Promise<Segment[]> {
    return this.prisma.segment.findMany({
      where: { organization_id: organizationId, course_id: courseId, deleted_at: null },
      orderBy: { order: 'asc' },
    });
  }

  async findSegment(organizationId: string, id: string): Promise<Segment> {
    const segment = await this.prisma.segment.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!segment) throw new NotFoundException('Segment not found');
    return segment;
  }

  async updateSegment(organizationId: string, id: string, dto: UpdateSegmentDto): Promise<Segment> {
    await this.findSegment(organizationId, id);
    return this.prisma.segment.update({ where: { id }, data: dto });
  }

  async deleteSegment(organizationId: string, id: string): Promise<void> {
    await this.findSegment(organizationId, id);
    await this.prisma.segment.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async createModule(organizationId: string, dto: CreateModuleDto): Promise<ModuleEntity> {
    await this.assertExists(
      () =>
        this.prisma.segment.findFirst({
          where: { id: dto.segment_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Segment',
    );
    return this.prisma.module.create({ data: { organization_id: organizationId, ...dto } });
  }

  findModulesBySegment(organizationId: string, segmentId: string): Promise<ModuleEntity[]> {
    return this.prisma.module.findMany({
      where: { organization_id: organizationId, segment_id: segmentId, deleted_at: null },
      orderBy: { order: 'asc' },
    });
  }

  async findModule(organizationId: string, id: string): Promise<ModuleEntity> {
    const module = await this.prisma.module.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  async updateModule(organizationId: string, id: string, dto: UpdateModuleDto): Promise<ModuleEntity> {
    await this.findModule(organizationId, id);
    return this.prisma.module.update({ where: { id }, data: dto });
  }

  async deleteModule(organizationId: string, id: string): Promise<void> {
    await this.findModule(organizationId, id);
    await this.prisma.module.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async createUnit(organizationId: string, dto: CreateUnitDto): Promise<Unit> {
    await this.assertExists(
      () =>
        this.prisma.module.findFirst({
          where: { id: dto.module_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Module',
    );
    return this.prisma.unit.create({ data: { organization_id: organizationId, ...dto } });
  }

  findUnitsByModule(organizationId: string, moduleId: string): Promise<Unit[]> {
    return this.prisma.unit.findMany({
      where: { organization_id: organizationId, module_id: moduleId, deleted_at: null },
      orderBy: { order: 'asc' },
    });
  }

  async findUnit(organizationId: string, id: string): Promise<Unit> {
    const unit = await this.prisma.unit.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async updateUnit(organizationId: string, id: string, dto: UpdateUnitDto): Promise<Unit> {
    await this.findUnit(organizationId, id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async deleteUnit(organizationId: string, id: string): Promise<void> {
    await this.findUnit(organizationId, id);
    await this.prisma.unit.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async createSubUnit(organizationId: string, dto: CreateSubUnitDto): Promise<SubUnit> {
    await this.assertExists(
      () =>
        this.prisma.unit.findFirst({
          where: { id: dto.unit_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Unit',
    );
    return this.prisma.subUnit.create({ data: { organization_id: organizationId, ...dto } });
  }

  findSubUnitsByUnit(organizationId: string, unitId: string): Promise<SubUnit[]> {
    return this.prisma.subUnit.findMany({
      where: { organization_id: organizationId, unit_id: unitId, deleted_at: null },
      orderBy: { order: 'asc' },
    });
  }

  async findSubUnit(organizationId: string, id: string): Promise<SubUnit> {
    const subUnit = await this.prisma.subUnit.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!subUnit) throw new NotFoundException('SubUnit not found');
    return subUnit;
  }

  async updateSubUnit(organizationId: string, id: string, dto: UpdateSubUnitDto): Promise<SubUnit> {
    await this.findSubUnit(organizationId, id);
    return this.prisma.subUnit.update({ where: { id }, data: dto });
  }

  async deleteSubUnit(organizationId: string, id: string): Promise<void> {
    await this.findSubUnit(organizationId, id);
    await this.prisma.subUnit.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async createLesson(organizationId: string, dto: CreateLessonDto): Promise<Lesson> {
    await this.assertExists(
      () =>
        this.prisma.subUnit.findFirst({
          where: { id: dto.sub_unit_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'SubUnit',
    );
    return this.prisma.lesson.create({ data: { organization_id: organizationId, ...dto } });
  }

  findLessonsBySubUnit(organizationId: string, subUnitId: string): Promise<Lesson[]> {
    return this.prisma.lesson.findMany({
      where: { organization_id: organizationId, sub_unit_id: subUnitId, deleted_at: null },
      orderBy: { order: 'asc' },
    });
  }

  async findLesson(organizationId: string, id: string): Promise<Lesson> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async updateLesson(organizationId: string, id: string, dto: UpdateLessonDto): Promise<Lesson> {
    await this.findLesson(organizationId, id);
    return this.prisma.lesson.update({ where: { id }, data: dto });
  }

  async deleteLesson(organizationId: string, id: string): Promise<void> {
    await this.findLesson(organizationId, id);
    await this.prisma.lesson.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  async createMaterial(organizationId: string, dto: CreateMaterialDto): Promise<Material> {
    await this.assertExists(
      () =>
        this.prisma.lesson.findFirst({
          where: { id: dto.lesson_id, organization_id: organizationId, deleted_at: null },
          select: { id: true },
        }),
      'Lesson',
    );
    this.assertMaterialContent(dto.type ?? MaterialType.ARQUIVO, dto.file_url, dto.content_html);
    return this.prisma.material.create({ data: { organization_id: organizationId, ...dto } });
  }

  findMaterialsByLesson(organizationId: string, lessonId: string): Promise<Material[]> {
    return this.prisma.material.findMany({
      where: { organization_id: organizationId, lesson_id: lessonId, deleted_at: null },
      orderBy: { created_at: 'asc' },
    });
  }

  async findMaterial(organizationId: string, id: string): Promise<Material> {
    const material = await this.prisma.material.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!material) throw new NotFoundException('Material not found');
    return material;
  }

  async updateMaterial(
    organizationId: string,
    id: string,
    dto: UpdateMaterialDto,
  ): Promise<Material> {
    const existing = await this.findMaterial(organizationId, id);
    this.assertMaterialContent(
      dto.type ?? existing.type,
      dto.file_url ?? existing.file_url ?? undefined,
      dto.content_html ?? existing.content_html ?? undefined,
    );
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  async deleteMaterial(organizationId: string, id: string): Promise<void> {
    await this.findMaterial(organizationId, id);
    await this.prisma.material.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /** Uploads the file for a MaterialType.ARQUIVO material to the private lms-materials bucket. */
  async uploadMaterialFile(
    organizationId: string,
    id: string,
    file: Buffer,
    contentType?: string,
  ): Promise<Material> {
    await this.findMaterial(organizationId, id);
    const fileUrl = await this.storage.upload('lms-materials', organizationId, id, file, contentType);
    return this.prisma.material.update({
      where: { id },
      data: { type: MaterialType.ARQUIVO, file_url: fileUrl },
    });
  }

  /** Signed URL for a staff member previewing an uploaded Material file. */
  async getMaterialDownloadUrl(organizationId: string, id: string): Promise<string | null> {
    const material = await this.findMaterial(organizationId, id);
    if (!material.file_url) return null;
    return this.storage.createSignedUrl('lms-materials', material.file_url);
  }

  /** ARQUIVO/VIDEO_EXTERNO need a URL; TEXTO needs inline HTML content. */
  private assertMaterialContent(type: MaterialType, fileUrl?: string, contentHtml?: string): void {
    if (type === MaterialType.TEXTO) {
      if (!contentHtml) throw new BadRequestException('content_html is required when type is TEXTO');
      return;
    }
    if (!fileUrl) throw new BadRequestException('file_url is required when type is ARQUIVO or VIDEO_EXTERNO');
  }

  /** Prevents linking a record to another organization's parent entity. */
  private async assertExists(
    finder: () => Promise<{ id: string } | null>,
    label: string,
  ): Promise<void> {
    const record = await finder();
    if (!record) throw new NotFoundException(`${label} not found`);
  }
}
