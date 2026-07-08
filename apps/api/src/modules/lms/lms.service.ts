import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Enrollment,
  LessonProgress,
  LessonProgressStatus,
  Quiz,
  QuizAttempt,
  QuizOption,
  QuizQuestion,
  Student,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AcademicService } from '../academic/academic.service';
import { MarkLessonProgressDto } from './dto/mark-lesson-progress.dto';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreateQuizQuestionDto } from './dto/create-quiz-question.dto';
import { UpdateQuizQuestionDto } from './dto/update-quiz-question.dto';
import { CreateQuizOptionDto } from './dto/create-quiz-option.dto';
import { UpdateQuizOptionDto } from './dto/update-quiz-option.dto';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';

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

  // ---------------------------------------------------------------------
  // Quiz authoring (staff)
  // ---------------------------------------------------------------------

  async createQuiz(organizationId: string, dto: CreateQuizDto): Promise<Quiz> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: dto.lesson_id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.quiz.create({ data: { organization_id: organizationId, ...dto } });
  }

  async getQuizByLesson(organizationId: string, lessonId: string): Promise<Quiz | null> {
    return this.prisma.quiz.findFirst({
      where: { organization_id: organizationId, lesson_id: lessonId, deleted_at: null },
      include: { questions: { where: { deleted_at: null }, orderBy: { order: 'asc' }, include: { options: { where: { deleted_at: null } } } } },
    });
  }

  async findQuiz(organizationId: string, id: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { questions: { where: { deleted_at: null }, orderBy: { order: 'asc' }, include: { options: { where: { deleted_at: null } } } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return quiz;
  }

  async updateQuiz(organizationId: string, id: string, dto: UpdateQuizDto): Promise<Quiz> {
    await this.assertQuizExists(organizationId, id);
    return this.prisma.quiz.update({ where: { id }, data: dto });
  }

  async deleteQuiz(organizationId: string, id: string): Promise<void> {
    await this.assertQuizExists(organizationId, id);
    await this.prisma.quiz.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private async assertQuizExists(organizationId: string, id: string): Promise<void> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
  }

  async createQuizQuestion(organizationId: string, dto: CreateQuizQuestionDto): Promise<QuizQuestion> {
    const quiz = await this.prisma.quiz.findFirst({
      where: { id: dto.quiz_id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    return this.prisma.quizQuestion.create({ data: { organization_id: organizationId, ...dto } });
  }

  async updateQuizQuestion(
    organizationId: string,
    id: string,
    dto: UpdateQuizQuestionDto,
  ): Promise<QuizQuestion> {
    await this.assertQuizQuestionExists(organizationId, id);
    return this.prisma.quizQuestion.update({ where: { id }, data: dto });
  }

  async deleteQuizQuestion(organizationId: string, id: string): Promise<void> {
    await this.assertQuizQuestionExists(organizationId, id);
    await this.prisma.quizQuestion.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private async assertQuizQuestionExists(organizationId: string, id: string): Promise<void> {
    const question = await this.prisma.quizQuestion.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!question) throw new NotFoundException('QuizQuestion not found');
  }

  async createQuizOption(organizationId: string, dto: CreateQuizOptionDto): Promise<QuizOption> {
    const question = await this.prisma.quizQuestion.findFirst({
      where: { id: dto.question_id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!question) throw new NotFoundException('QuizQuestion not found');
    return this.prisma.quizOption.create({ data: { organization_id: organizationId, ...dto } });
  }

  async updateQuizOption(
    organizationId: string,
    id: string,
    dto: UpdateQuizOptionDto,
  ): Promise<QuizOption> {
    await this.assertQuizOptionExists(organizationId, id);
    return this.prisma.quizOption.update({ where: { id }, data: dto });
  }

  async deleteQuizOption(organizationId: string, id: string): Promise<void> {
    await this.assertQuizOptionExists(organizationId, id);
    await this.prisma.quizOption.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  private async assertQuizOptionExists(organizationId: string, id: string): Promise<void> {
    const option = await this.prisma.quizOption.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!option) throw new NotFoundException('QuizOption not found');
  }

  // ---------------------------------------------------------------------
  // Quiz attempts (student)
  // ---------------------------------------------------------------------

  /**
   * Student-facing quiz fetch, used to render the attempt form. Strips
   * QuizOption.is_correct — unlike findQuiz/getQuizByLesson (staff-only
   * authoring views), this must never leak the answer key to the student
   * taking the quiz. Also checks the student is actually enrolled in the
   * quiz's lesson's course (IDOR).
   */
  async getQuizForAttempt(organizationId: string, userProfileId: string, quizId: string) {
    const student = await this.resolveStudent(organizationId, userProfileId);

    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, organization_id: organizationId, deleted_at: null },
      include: {
        lesson: { include: { subUnit: { include: { unit: { include: { module: { include: { segment: true } } } } } } } },
        questions: {
          where: { deleted_at: null },
          orderBy: { order: 'asc' },
          include: { options: { where: { deleted_at: null } } },
        },
      },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const courseId = quiz.lesson.subUnit.unit.module.segment.course_id;
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { student_id: student.id, course_id: courseId, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!enrollment) {
      throw new ForbiddenException('Student is not enrolled in this quiz\'s course');
    }

    return {
      id: quiz.id,
      title: quiz.title,
      questions: quiz.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        order: question.order,
        options: question.options.map((option) => ({ id: option.id, text: option.text })),
      })),
    };
  }

  /**
   * Formative only — does not gate lesson completion or the certificate
   * (RN-05 is still driven solely by TheoryExam/PracticalExam/Attendance).
   * Score is the percentage of questions answered with the correct option.
   */
  async submitQuizAttempt(
    organizationId: string,
    userProfileId: string,
    quizId: string,
    dto: SubmitQuizAttemptDto,
  ): Promise<QuizAttempt> {
    const student = await this.resolveStudent(organizationId, userProfileId);

    const quiz = await this.prisma.quiz.findFirst({
      where: { id: quizId, organization_id: organizationId, deleted_at: null },
      include: { questions: { where: { deleted_at: null }, include: { options: { where: { deleted_at: null } } } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const totalQuestions = quiz.questions.length;
    const correctAnswers = quiz.questions.filter((question) => {
      const chosenOptionId = dto.answers[question.id];
      const chosenOption = question.options.find((option) => option.id === chosenOptionId);
      return chosenOption?.is_correct === true;
    }).length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return this.prisma.quizAttempt.create({
      data: {
        organization_id: organizationId,
        quiz_id: quizId,
        student_id: student.id,
        score,
        answers: dto.answers,
      },
    });
  }
}
