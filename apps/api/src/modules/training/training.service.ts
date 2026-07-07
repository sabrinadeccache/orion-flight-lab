import { Injectable, NotFoundException } from '@nestjs/common';
import { Course, Curriculum, TrainingProgram } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

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

  /** Prevents linking a record to another organization's parent entity. */
  private async assertExists(
    finder: () => Promise<{ id: string } | null>,
    label: string,
  ): Promise<void> {
    const record = await finder();
    if (!record) throw new NotFoundException(`${label} not found`);
  }
}
