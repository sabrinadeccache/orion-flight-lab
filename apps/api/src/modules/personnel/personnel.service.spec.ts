import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PersonnelService } from './personnel.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

const ORG_ID = 'org-1';
const QUALIFICATION_DTO = {
  aircraft_type: 'C172',
  qualification_type: 'PIC',
  issued_at: '2026-01-01',
  expires_at: '2027-01-01',
};

describe('PersonnelService', () => {
  let service: PersonnelService;
  let prisma: {
    instructor: { findFirst: jest.Mock };
    examiner: { findFirst: jest.Mock };
    aircraftQualification: { count: jest.Mock; create: jest.Mock };
    proficiency: { findFirst: jest.Mock; create: jest.Mock };
    instructorLessonLog: { findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      instructor: { findFirst: jest.fn() },
      examiner: { findFirst: jest.fn() },
      aircraftQualification: { count: jest.fn(), create: jest.fn() },
      proficiency: { findFirst: jest.fn(), create: jest.fn() },
      instructorLessonLog: { findMany: jest.fn(), create: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        PersonnelService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: { upload: jest.fn() } },
      ],
    }).compile();

    service = module.get(PersonnelService);
  });

  describe('RN-17: instructor max 2 aircraft qualifications', () => {
    beforeEach(() => {
      prisma.instructor.findFirst.mockResolvedValue({ id: 'instructor-1' });
    });

    it('blocks a 3rd simultaneous qualification', async () => {
      prisma.aircraftQualification.count.mockResolvedValue(2);

      await expect(
        service.addInstructorQualification(ORG_ID, 'instructor-1', QUALIFICATION_DTO),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.aircraftQualification.create).not.toHaveBeenCalled();
    });

    it('allows the 2nd qualification', async () => {
      prisma.aircraftQualification.count.mockResolvedValue(1);
      prisma.aircraftQualification.create.mockResolvedValue({ id: 'qual-1' });

      const result = await service.addInstructorQualification(
        ORG_ID,
        'instructor-1',
        QUALIFICATION_DTO,
      );

      expect(result).toEqual({ id: 'qual-1' });
    });

    it('throws NotFoundException for an instructor outside the organization', async () => {
      prisma.instructor.findFirst.mockResolvedValue(null);

      await expect(
        service.addInstructorQualification(ORG_ID, 'instructor-1', QUALIFICATION_DTO),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('RN-18: examiner max 2 aircraft accreditations', () => {
    beforeEach(() => {
      prisma.examiner.findFirst.mockResolvedValue({ id: 'examiner-1' });
    });

    it('blocks a 3rd simultaneous accreditation', async () => {
      prisma.aircraftQualification.count.mockResolvedValue(2);

      await expect(
        service.addExaminerQualification(ORG_ID, 'examiner-1', QUALIFICATION_DTO),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows the 2nd accreditation', async () => {
      prisma.aircraftQualification.count.mockResolvedValue(1);
      prisma.aircraftQualification.create.mockResolvedValue({ id: 'qual-2' });

      const result = await service.addExaminerQualification(ORG_ID, 'examiner-1', QUALIFICATION_DTO);

      expect(result).toEqual({ id: 'qual-2' });
    });
  });

  describe('RN-16: proficiency renewal within 45 days of previous expiry', () => {
    beforeEach(() => {
      prisma.instructor.findFirst.mockResolvedValue({ id: 'instructor-1' });
    });

    it('allows the first proficiency ever registered (no previous to compare)', async () => {
      prisma.proficiency.findFirst.mockResolvedValue(null);
      prisma.proficiency.create.mockResolvedValue({ id: 'prof-1' });

      const result = await service.addProficiency(ORG_ID, 'instructor-1', {
        evaluated_at: '2026-01-01',
        valid_until: '2027-01-01',
        evaluator_name: 'Fulano',
      });

      expect(result).toEqual({ id: 'prof-1' });
    });

    it('blocks renewal more than 45 days outside the previous valid_until', async () => {
      prisma.proficiency.findFirst.mockResolvedValue({ valid_until: new Date('2026-01-01') });

      await expect(
        service.addProficiency(ORG_ID, 'instructor-1', {
          evaluated_at: '2026-06-01',
          valid_until: '2027-06-01',
          evaluator_name: 'Fulano',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows renewal within the 45-day window before the previous valid_until', async () => {
      prisma.proficiency.findFirst.mockResolvedValue({ valid_until: new Date('2026-01-01') });
      prisma.proficiency.create.mockResolvedValue({ id: 'prof-2' });

      const result = await service.addProficiency(ORG_ID, 'instructor-1', {
        evaluated_at: '2025-12-20',
        valid_until: '2026-12-20',
        evaluator_name: 'Fulano',
      });

      expect(result).toEqual({ id: 'prof-2' });
    });
  });

  describe('RN-15: max 8h of instructor teaching within a rolling 24h window', () => {
    beforeEach(() => {
      prisma.instructor.findFirst.mockResolvedValue({ id: 'instructor-1' });
    });

    it('blocks a lesson that would push the 24h total past 8h', async () => {
      prisma.instructorLessonLog.findMany.mockResolvedValue([{ hours: 6 }]);

      await expect(
        service.registerLessonLog(ORG_ID, 'instructor-1', {
          course_id: 'course-1',
          lesson_id: 'lesson-1',
          hours: 3,
          delivered_at: '2026-01-01T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.instructorLessonLog.create).not.toHaveBeenCalled();
    });

    it('allows a lesson that keeps the 24h total at or under 8h', async () => {
      prisma.instructorLessonLog.findMany.mockResolvedValue([{ hours: 6 }]);
      prisma.instructorLessonLog.create.mockResolvedValue({ id: 'log-1' });

      const result = await service.registerLessonLog(ORG_ID, 'instructor-1', {
        course_id: 'course-1',
        lesson_id: 'lesson-1',
        hours: 2,
        delivered_at: '2026-01-01T10:00:00.000Z',
      });

      expect(result).toEqual({ id: 'log-1' });
    });
  });
});
