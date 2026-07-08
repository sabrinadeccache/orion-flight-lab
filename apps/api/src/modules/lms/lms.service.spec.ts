import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LessonProgressStatus } from '@prisma/client';
import { LmsService } from './lms.service';
import { PrismaService } from '../../common/prisma/prisma.service';
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
    };
    academicService = { registerAttendance: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        LmsService,
        { provide: PrismaService, useValue: prisma },
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
});
