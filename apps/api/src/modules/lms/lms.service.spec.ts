import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LessonProgressStatus } from '@prisma/client';
import { LmsService } from './lms.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { AcademicService } from '../academic/academic.service';

const ORG_ID = 'org-1';
const USER_ID = 'user-1';

describe('LmsService', () => {
  let service: LmsService;
  let prisma: {
    student: { findFirst: jest.Mock };
    enrollment: { findMany: jest.Mock; findFirst: jest.Mock };
    lesson: { count: jest.Mock; findFirst: jest.Mock };
    lessonProgress: { count: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock };
    course: { findFirst: jest.Mock };
    quiz: { findFirst: jest.Mock; create: jest.Mock };
    quizAttempt: { create: jest.Mock };
    material: { findFirst: jest.Mock };
  };
  let academicService: { registerAttendance: jest.Mock };

  beforeEach(async () => {
    prisma = {
      student: { findFirst: jest.fn() },
      enrollment: { findMany: jest.fn(), findFirst: jest.fn() },
      lesson: { count: jest.fn(), findFirst: jest.fn() },
      lessonProgress: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      course: { findFirst: jest.fn() },
      quiz: { findFirst: jest.fn(), create: jest.fn() },
      quizAttempt: { create: jest.fn() },
      material: { findFirst: jest.fn() },
    };
    academicService = { registerAttendance: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        LmsService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { upload: jest.fn(), createSignedUrl: jest.fn() } },
        { provide: AcademicService, useValue: academicService },
      ],
    }).compile();

    service = module.get(LmsService);
  });

  describe('resolveStudent (used by every ALUNO endpoint)', () => {
    it('rejects a user with no linked Student record', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.getMyEnrollments(ORG_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('markLessonProgress', () => {
    const lesson = {
      id: 'lesson-1',
      subUnit: { unit: { module: { segment: { course_id: 'course-1' } } } },
    };

    beforeEach(() => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.lesson.findFirst.mockResolvedValue(lesson);
    });

    it('rejects when the student has no active enrollment in the lesson\'s course (IDOR)', async () => {
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.markLessonProgress(ORG_ID, USER_ID, 'lesson-1', {
          status: LessonProgressStatus.EM_ANDAMENTO,
        }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.lessonProgress.upsert).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a lesson outside the organization', async () => {
      prisma.lesson.findFirst.mockResolvedValue(null);

      await expect(
        service.markLessonProgress(ORG_ID, USER_ID, 'lesson-1', {
          status: LessonProgressStatus.EM_ANDAMENTO,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('marks CONCLUIDO and registers an Attendance the first time', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'enrollment-1' });
      prisma.lessonProgress.findUnique.mockResolvedValue(null);
      prisma.lessonProgress.upsert.mockResolvedValue({ id: 'progress-1', status: 'CONCLUIDO' });

      await service.markLessonProgress(ORG_ID, USER_ID, 'lesson-1', {
        status: LessonProgressStatus.CONCLUIDO,
      });

      expect(academicService.registerAttendance).toHaveBeenCalledWith(
        ORG_ID,
        expect.objectContaining({ enrollment_id: 'enrollment-1', lesson_id: 'lesson-1', present: true }),
      );
    });

    it('does not re-register Attendance if the lesson was already CONCLUIDO', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'enrollment-1' });
      prisma.lessonProgress.findUnique.mockResolvedValue({ status: LessonProgressStatus.CONCLUIDO });
      prisma.lessonProgress.upsert.mockResolvedValue({ id: 'progress-1', status: 'CONCLUIDO' });

      await service.markLessonProgress(ORG_ID, USER_ID, 'lesson-1', {
        status: LessonProgressStatus.CONCLUIDO,
      });

      expect(academicService.registerAttendance).not.toHaveBeenCalled();
    });

    it('does not register Attendance when only marking EM_ANDAMENTO', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'enrollment-1' });
      prisma.lessonProgress.findUnique.mockResolvedValue(null);
      prisma.lessonProgress.upsert.mockResolvedValue({ id: 'progress-1', status: 'EM_ANDAMENTO' });

      await service.markLessonProgress(ORG_ID, USER_ID, 'lesson-1', {
        status: LessonProgressStatus.EM_ANDAMENTO,
      });

      expect(academicService.registerAttendance).not.toHaveBeenCalled();
    });
  });

  describe('getMaterialDownloadUrl', () => {
    let storage: { upload: jest.Mock; createSignedUrl: jest.Mock };

    beforeEach(async () => {
      storage = { upload: jest.fn(), createSignedUrl: jest.fn() };
      const module = await Test.createTestingModule({
        providers: [
          LmsService,
          { provide: PrismaService, useValue: prisma },
          { provide: StorageService, useValue: storage },
          { provide: AcademicService, useValue: academicService },
        ],
      }).compile();
      service = module.get(LmsService);

      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    });

    const materialWithLesson = {
      id: 'material-1',
      file_url: 'org-1/material-1',
      lesson: { subUnit: { unit: { module: { segment: { course_id: 'course-1' } } } } },
    };

    it('rejects a student not enrolled in the material\'s course (IDOR)', async () => {
      prisma.material.findFirst.mockResolvedValue(materialWithLesson);
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.getMaterialDownloadUrl(ORG_ID, USER_ID, 'material-1'),
      ).rejects.toThrow(ForbiddenException);
      expect(storage.createSignedUrl).not.toHaveBeenCalled();
    });

    it('returns a signed URL once enrollment is confirmed', async () => {
      prisma.material.findFirst.mockResolvedValue(materialWithLesson);
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'enrollment-1' });
      storage.createSignedUrl.mockResolvedValue('https://signed.example/material-1');

      const result = await service.getMaterialDownloadUrl(ORG_ID, USER_ID, 'material-1');

      expect(result).toEqual({ url: 'https://signed.example/material-1' });
      expect(storage.createSignedUrl).toHaveBeenCalledWith('lms-materials', 'org-1/material-1');
    });
  });

  describe('getLessonForStudent', () => {
    const lessonWithChain = {
      id: 'lesson-1',
      name: 'Lição 1',
      duration_hours: '1',
      materials: [
        { id: 'material-1', name: 'Slide', type: 'ARQUIVO', content_html: null, file_url: 'org-1/material-1' },
      ],
      quiz: { id: 'quiz-1' },
      subUnit: { unit: { module: { segment: { course_id: 'course-1' } } } },
    };

    beforeEach(() => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.lesson.findFirst.mockResolvedValue(lessonWithChain);
    });

    it('rejects a student not enrolled in the course (IDOR)', async () => {
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(service.getLessonForStudent(ORG_ID, USER_ID, 'lesson-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('never leaks the raw storage path of an ARQUIVO material', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'enrollment-1' });
      prisma.lessonProgress.findUnique.mockResolvedValue(null);

      const result = await service.getLessonForStudent(ORG_ID, USER_ID, 'lesson-1');

      expect(result.materials[0].file_url).toBeNull();
      expect(result.hasQuiz).toBe(true);
      expect(result.progressStatus).toBe(LessonProgressStatus.NAO_INICIADO);
      expect(result.enrollmentId).toBe('enrollment-1');
    });
  });

  describe('getCourseProgress', () => {
    it('throws NotFoundException for a course outside the organization', async () => {
      prisma.course.findFirst.mockResolvedValue(null);

      await expect(service.getCourseProgress(ORG_ID, 'course-1')).rejects.toThrow(NotFoundException);
    });

    it('computes the completion percent per enrolled student', async () => {
      prisma.course.findFirst.mockResolvedValue({ id: 'course-1' });
      prisma.lesson.count.mockResolvedValue(4);
      prisma.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', student: { id: 'student-1', full_name: 'Aluno 1' } },
      ]);
      prisma.lessonProgress.count.mockResolvedValue(2);

      const result = await service.getCourseProgress(ORG_ID, 'course-1');

      expect(result).toEqual([
        {
          student: { id: 'student-1', full_name: 'Aluno 1' },
          enrollmentId: 'enrollment-1',
          totalLessons: 4,
          completedLessons: 2,
          percent: 50,
        },
      ]);
    });
  });

  describe('submitQuizAttempt', () => {
    const quizWithQuestions = {
      id: 'quiz-1',
      questions: [
        {
          id: 'question-1',
          options: [
            { id: 'option-1', is_correct: true },
            { id: 'option-2', is_correct: false },
          ],
        },
        {
          id: 'question-2',
          options: [
            { id: 'option-3', is_correct: false },
            { id: 'option-4', is_correct: true },
          ],
        },
      ],
    };

    beforeEach(() => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.quiz.findFirst.mockResolvedValue(quizWithQuestions);
    });

    it('throws NotFoundException for a quiz outside the organization', async () => {
      prisma.quiz.findFirst.mockResolvedValue(null);

      await expect(
        service.submitQuizAttempt(ORG_ID, USER_ID, 'quiz-1', { answers: {} }),
      ).rejects.toThrow(NotFoundException);
    });

    it('scores 100 when every answer is correct', async () => {
      prisma.quizAttempt.create.mockResolvedValue({ id: 'attempt-1', score: 100 });

      await service.submitQuizAttempt(ORG_ID, USER_ID, 'quiz-1', {
        answers: { 'question-1': 'option-1', 'question-2': 'option-4' },
      });

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ score: 100, student_id: 'student-1', quiz_id: 'quiz-1' }),
      });
    });

    it('scores 50 when only one of two answers is correct', async () => {
      prisma.quizAttempt.create.mockResolvedValue({ id: 'attempt-1', score: 50 });

      await service.submitQuizAttempt(ORG_ID, USER_ID, 'quiz-1', {
        answers: { 'question-1': 'option-1', 'question-2': 'option-3' },
      });

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ score: 50 }),
      });
    });

    it('scores 0 when a question is left unanswered', async () => {
      prisma.quizAttempt.create.mockResolvedValue({ id: 'attempt-1', score: 0 });

      await service.submitQuizAttempt(ORG_ID, USER_ID, 'quiz-1', { answers: {} });

      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ score: 0 }),
      });
    });
  });

  describe('getQuizForAttempt', () => {
    const quizWithLesson = {
      id: 'quiz-1',
      title: 'Quiz 1',
      lesson: { subUnit: { unit: { module: { segment: { course_id: 'course-1' } } } } },
      questions: [
        {
          id: 'question-1',
          prompt: 'Pergunta?',
          order: 0,
          options: [
            { id: 'option-1', text: 'A', is_correct: true },
            { id: 'option-2', text: 'B', is_correct: false },
          ],
        },
      ],
    };

    beforeEach(() => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.quiz.findFirst.mockResolvedValue(quizWithLesson);
    });

    it('rejects a student not enrolled in the quiz\'s course (IDOR)', async () => {
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(service.getQuizForAttempt(ORG_ID, USER_ID, 'quiz-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('never leaks is_correct to the student taking the quiz', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({ id: 'enrollment-1' });

      const result = await service.getQuizForAttempt(ORG_ID, USER_ID, 'quiz-1');

      expect(JSON.stringify(result)).not.toContain('is_correct');
      expect(result.questions[0].options).toEqual([
        { id: 'option-1', text: 'A' },
        { id: 'option-2', text: 'B' },
      ]);
    });
  });
});
