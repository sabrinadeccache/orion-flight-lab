import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Enrollment, LessonProgress, LessonProgressStatus, Student } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AcademicService } from '../academic/academic.service';
import { MarkLessonProgressDto } from './dto/mark-lesson-progress.dto';

type EnrollmentSummary = Enrollment & {
  course: { id: string; name: string; code: string; status: string };
  totalLessons: number;
  completedLessons: number;
};

@Injectable()
export class LmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicService: AcademicService,
  ) {}

  /** Resolves the Student record linked to the authenticated portal user. */
  private async resolveStudent(organizationId: string, userProfileId: string): Promise<Student> {
    const student = await this.prisma.student.findFirst({
      where: { user_profile_id: userProfileId, organization_id: organizationId, deleted_at: null },
    });
    if (!student) {
      throw new ForbiddenException('No student record is linked to this account');
    }
    return student;
  }

  private countLessonsForCourse(organizationId: string, courseId: string): Promise<number> {
    return this.prisma.lesson.count({
      where: {
        organization_id: organizationId,
        deleted_at: null,
        subUnit: { unit: { module: { segment: { course_id: courseId } } } },
      },
    });
  }

  async getMyEnrollments(organizationId: string, userProfileId: string): Promise<EnrollmentSummary[]> {
    const student = await this.resolveStudent(organizationId, userProfileId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { student_id: student.id, organization_id: organizationId, deleted_at: null },
      include: { course: { select: { id: true, name: true, code: true, status: true } } },
      orderBy: { enrolled_at: 'desc' },
    });

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const [totalLessons, completedLessons] = await Promise.all([
          this.countLessonsForCourse(organizationId, enrollment.course_id),
          this.prisma.lessonProgress.count({
            where: { enrollment_id: enrollment.id, status: LessonProgressStatus.CONCLUIDO },
          }),
        ]);
        return { ...enrollment, totalLessons, completedLessons };
      }),
    );
  }

  async getEnrollmentContent(organizationId: string, userProfileId: string, enrollmentId: string) {
    const student = await this.resolveStudent(organizationId, userProfileId);
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        id: enrollmentId,
        student_id: student.id,
        organization_id: organizationId,
        deleted_at: null,
      },
      include: {
        course: {
          include: {
            segments: {
              where: { deleted_at: null },
              orderBy: { order: 'asc' },
              include: {
                modules: {
                  where: { deleted_at: null },
                  orderBy: { order: 'asc' },
                  include: {
                    units: {
                      where: { deleted_at: null },
                      orderBy: { order: 'asc' },
                      include: {
                        subUnits: {
                          where: { deleted_at: null },
                          orderBy: { order: 'asc' },
                          include: {
                            lessons: {
                              where: { deleted_at: null },
                              orderBy: { order: 'asc' },
                              include: {
                                materials: { where: { deleted_at: null } },
                                quiz: { select: { id: true } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const progresses = await this.prisma.lessonProgress.findMany({
      where: { enrollment_id: enrollment.id, student_id: student.id },
    });
    const progressByLesson = new Map<string, LessonProgress>(progresses.map((p) => [p.lesson_id, p]));

    const segments = enrollment.course.segments.map((segment) => ({
      ...segment,
      modules: segment.modules.map((module) => ({
        ...module,
        units: module.units.map((unit) => ({
          ...unit,
          subUnits: unit.subUnits.map((subUnit) => ({
            ...subUnit,
            lessons: subUnit.lessons.map((lesson) => ({
              ...lesson,
              hasQuiz: lesson.quiz !== null,
              progressStatus:
                progressByLesson.get(lesson.id)?.status ?? LessonProgressStatus.NAO_INICIADO,
            })),
          })),
        })),
      })),
    }));

    return { enrollment: { id: enrollment.id, status: enrollment.status }, course: enrollment.course, segments };
  }

  async markLessonProgress(
    organizationId: string,
    userProfileId: string,
    lessonId: string,
    dto: MarkLessonProgressDto,
  ): Promise<LessonProgress> {
    const student = await this.resolveStudent(organizationId, userProfileId);

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, organization_id: organizationId, deleted_at: null },
      include: { subUnit: { include: { unit: { include: { module: { include: { segment: true } } } } } } },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }
    const courseId = lesson.subUnit.unit.module.segment.course_id;

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        student_id: student.id,
        course_id: courseId,
        organization_id: organizationId,
        deleted_at: null,
      },
    });
    if (!enrollment) {
      throw new ForbiddenException('Student is not enrolled in this lesson\'s course');
    }

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { student_id_lesson_id: { student_id: student.id, lesson_id: lessonId } },
    });

    const now = new Date();
    const progress = await this.prisma.lessonProgress.upsert({
      where: { student_id_lesson_id: { student_id: student.id, lesson_id: lessonId } },
      create: {
        organization_id: organizationId,
        student_id: student.id,
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        status: dto.status,
        started_at: now,
        completed_at: dto.status === LessonProgressStatus.CONCLUIDO ? now : undefined,
      },
      update: {
        status: dto.status,
        started_at: existing?.started_at ?? now,
        completed_at: dto.status === LessonProgressStatus.CONCLUIDO ? now : existing?.completed_at,
      },
    });

    // Reuses AcademicService.registerAttendance (and its RN-05 auto-issue
    // trigger) instead of duplicating certificate logic — only the first
    // time this lesson is marked CONCLUIDO for this enrollment.
    if (dto.status === LessonProgressStatus.CONCLUIDO && existing?.status !== LessonProgressStatus.CONCLUIDO) {
      await this.academicService.registerAttendance(organizationId, {
        enrollment_id: enrollment.id,
        lesson_id: lessonId,
        date: now.toISOString(),
        present: true,
      });
    }

    return progress;
  }

  async getCourseProgress(organizationId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, organization_id: organizationId, deleted_at: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalLessons = await this.countLessonsForCourse(organizationId, courseId);
    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId, organization_id: organizationId, deleted_at: null },
      include: { student: { select: { id: true, full_name: true } } },
    });

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const completedLessons = await this.prisma.lessonProgress.count({
          where: { enrollment_id: enrollment.id, status: LessonProgressStatus.CONCLUIDO },
        });
        const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        return {
          student: enrollment.student,
          enrollmentId: enrollment.id,
          totalLessons,
          completedLessons,
          percent,
        };
      }),
    );
  }
}
