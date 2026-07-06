import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrollmentStatus, ExpiryStatus } from '@prisma/client';
import { ExamType } from '@orion/shared';
import { AcademicService } from './academic.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';

const ORG_ID = 'org-1';

describe('AcademicService', () => {
  let service: AcademicService;
  let prisma: {
    student: { findFirst: jest.Mock };
    course: { findFirst: jest.Mock };
    enrollment: {
      findFirst: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    theoryExam: { create: jest.Mock };
    practicalExam: { create: jest.Mock };
    certificate: { create: jest.Mock };
    qualification: { updateMany: jest.Mock };
  };
  let storage: { upload: jest.Mock };

  beforeEach(async () => {
    prisma = {
      student: { findFirst: jest.fn() },
      course: { findFirst: jest.fn() },
      enrollment: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      theoryExam: { create: jest.fn() },
      practicalExam: { create: jest.fn() },
      certificate: { create: jest.fn() },
      qualification: { updateMany: jest.fn() },
    };
    storage = { upload: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get(AcademicService);
  });

  describe('RN-11: max 25 active enrollments per course', () => {
    beforeEach(() => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.course.findFirst.mockResolvedValue({ id: 'course-1', max_students: 25 });
    });

    it('blocks enrollment once the course has 25 active students', async () => {
      prisma.enrollment.count.mockResolvedValue(25);

      await expect(
        service.createEnrollment(ORG_ID, { student_id: 'student-1', course_id: 'course-1' }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.enrollment.create).not.toHaveBeenCalled();
    });

    it('allows enrollment below the 25-student threshold', async () => {
      prisma.enrollment.count.mockResolvedValue(24);
      prisma.enrollment.create.mockResolvedValue({ id: 'enrollment-1' });

      const result = await service.createEnrollment(ORG_ID, {
        student_id: 'student-1',
        course_id: 'course-1',
      });

      expect(result).toEqual({ id: 'enrollment-1' });
      expect(prisma.enrollment.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: EnrollmentStatus.ATIVA }) }),
      );
    });
  });

  describe('RN-07: fraud quarantine blocks new exams', () => {
    const examDto = {
      type: ExamType.TEORICO,
      enrollment_id: 'enrollment-1',
      exam_date: '2026-01-01',
    };

    it('blocks registering an exam while the student is quarantined', async () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: future },
      });

      await expect(service.registerExam(ORG_ID, examDto)).rejects.toThrow(BadRequestException);
      expect(prisma.theoryExam.create).not.toHaveBeenCalled();
    });

    it('allows registering an exam once the quarantine has expired', async () => {
      const past = new Date('2020-01-01');
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: past },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-1' });

      const result = await service.registerExam(ORG_ID, examDto);

      expect(result).toEqual({ id: 'exam-1', type: ExamType.TEORICO });
    });

    it('allows registering an exam when the student was never quarantined', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: null },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-2' });

      const result = await service.registerExam(ORG_ID, examDto);

      expect(result).toEqual({ id: 'exam-2', type: ExamType.TEORICO });
    });

    it('throws NotFoundException when the enrollment does not belong to the organization', async () => {
      prisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(service.registerExam(ORG_ID, examDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('RN-05: certificate requires attendance + approved theory + approved practical', () => {
    const certDto = { enrollment_id: 'enrollment-1' };

    it('blocks issuance when the practical exam is missing', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [],
        attendances: [{ id: 'attendance-1' }],
      });

      await expect(service.issueCertificate(ORG_ID, certDto)).rejects.toThrow(BadRequestException);
      expect(storage.upload).not.toHaveBeenCalled();
    });

    it('blocks issuance when there is no attendance recorded', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [{ result: 'APROVADO' }],
        attendances: [],
      });

      await expect(service.issueCertificate(ORG_ID, certDto)).rejects.toThrow(BadRequestException);
    });

    it('issues the certificate once every requirement is met', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [{ result: 'APROVADO' }],
        attendances: [{ id: 'attendance-1' }],
      });
      storage.upload.mockResolvedValue('certificates/org-1/CERT-123.pdf');
      prisma.certificate.create.mockResolvedValue({
        id: 'certificate-1',
        certificate_number: 'CERT-org-1-123',
        file_url: 'certificates/org-1/CERT-123.pdf',
      });
      prisma.enrollment.update.mockResolvedValue({});

      const result = await service.issueCertificate(ORG_ID, certDto);

      expect(result.id).toBe('certificate-1');
      expect(prisma.enrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'enrollment-1' },
          data: expect.objectContaining({ status: EnrollmentStatus.CONCLUIDA }),
        }),
      );
    });
  });

  describe('RN-13: daily expiry sweep', () => {
    it('reports how many qualifications and enrollments were updated', async () => {
      prisma.qualification.updateMany.mockResolvedValue({ count: 3 });
      prisma.enrollment.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.updateExpiredStatuses();

      expect(result).toEqual({ qualifications: 3, enrollments: 2 });
      expect(prisma.qualification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ExpiryStatus.VENCIDO } }),
      );
      expect(prisma.enrollment.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: EnrollmentStatus.EXPIRADA } }),
      );
    });
  });
});
