import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EnrollmentStatus, ExpiryStatus } from '@prisma/client';
import { ExamType } from '@orion/shared';
import { AcademicService } from './academic.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { SupabaseAdminService } from '../../common/supabase-admin/supabase-admin.service';

const ORG_ID = 'org-1';

describe('AcademicService', () => {
  let service: AcademicService;
  let prisma: {
    student: { findFirst: jest.Mock; update: jest.Mock };
    userProfile: { create: jest.Mock };
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
    lesson: { findFirst: jest.Mock };
    attendance: { create: jest.Mock };
    certificate: { create: jest.Mock; findFirst: jest.Mock };
    qualification: { updateMany: jest.Mock; create: jest.Mock };
  };
  let storage: { upload: jest.Mock };
  let supabaseAdmin: { inviteStudent: jest.Mock };

  beforeEach(async () => {
    prisma = {
      student: { findFirst: jest.fn(), update: jest.fn() },
      userProfile: { create: jest.fn() },
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
      lesson: { findFirst: jest.fn() },
      attendance: { create: jest.fn() },
      certificate: { create: jest.fn(), findFirst: jest.fn() },
      qualification: { updateMany: jest.fn(), create: jest.fn() },
    };
    storage = { upload: jest.fn() };
    supabaseAdmin = { inviteStudent: jest.fn() };
    prisma.certificate.findFirst.mockResolvedValue(null);

    const module = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
        { provide: SupabaseAdminService, useValue: supabaseAdmin },
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

    const baseEnrollment = {
      id: 'enrollment-1',
      theoryExams: [],
      practicalExams: [],
      attendances: [],
      course: { min_passing_score: null, modality: 'MISTO', code: 'X' },
    };

    it('blocks registering an exam while the student is quarantined', async () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      prisma.enrollment.findFirst.mockResolvedValue({
        ...baseEnrollment,
        student: { fraud_quarantine_until: future },
      });

      await expect(service.registerExam(ORG_ID, examDto)).rejects.toThrow(BadRequestException);
      expect(prisma.theoryExam.create).not.toHaveBeenCalled();
    });

    it('allows registering an exam once the quarantine has expired', async () => {
      const past = new Date('2020-01-01');
      prisma.enrollment.findFirst.mockResolvedValue({
        ...baseEnrollment,
        student: { fraud_quarantine_until: past },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-1' });

      const result = await service.registerExam(ORG_ID, examDto);

      expect(result).toEqual({ id: 'exam-1', type: ExamType.TEORICO });
    });

    it('allows registering an exam when the student was never quarantined', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        ...baseEnrollment,
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

  describe('RN-05: certificate requires attendance + the exams the course modality demands', () => {
    const certDto = { enrollment_id: 'enrollment-1' };

    it('blocks issuance when the practical exam is missing on a MISTO course', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        course_id: 'course-1',
        course: { code: 'PPL-101', modality: 'MISTO' },
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
        course_id: 'course-1',
        course: { code: 'PPL-101', modality: 'MISTO' },
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [{ result: 'APROVADO' }],
        attendances: [],
      });

      await expect(service.issueCertificate(ORG_ID, certDto)).rejects.toThrow(BadRequestException);
    });

    it('issues the certificate for a MISTO course once both exams are approved, without creating a qualification', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        course_id: 'course-1',
        course: { code: 'PPL-101', modality: 'MISTO' },
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [{ result: 'APROVADO' }],
        attendances: [{ id: 'attendance-1' }],
      });
      storage.upload.mockResolvedValue('certificates/org-1/CERT-123.pdf');
      prisma.certificate.create.mockResolvedValue({
        id: 'certificate-1',
        certificate_number: 'CERT-org-1-123',
        file_url: 'certificates/org-1/CERT-123.pdf',
        issued_at: new Date('2026-01-01'),
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
      expect(prisma.qualification.create).not.toHaveBeenCalled();
    });

    it('issues the certificate for a TEORICO course from theory alone, and auto-creates the Qualification', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        course_id: 'course-1',
        course: { code: 'CTA-TEO', modality: 'TEORICO' },
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [],
        attendances: [{ id: 'attendance-1' }],
      });
      storage.upload.mockResolvedValue('certificates/org-1/CERT-124.pdf');
      prisma.certificate.create.mockResolvedValue({
        id: 'certificate-2',
        certificate_number: 'CERT-org-1-124',
        file_url: 'certificates/org-1/CERT-124.pdf',
        issued_at: new Date('2026-01-02'),
      });
      prisma.enrollment.update.mockResolvedValue({});
      prisma.qualification.create.mockResolvedValue({ id: 'qualification-1' });

      const result = await service.issueCertificate(ORG_ID, certDto);

      expect(result.id).toBe('certificate-2');
      expect(prisma.qualification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organization_id: ORG_ID,
            student_id: 'student-1',
            course_id: 'course-1',
            certificate_id: 'certificate-2',
            qualification_code: 'CTA-TEO',
          }),
        }),
      );
    });

    it('issues the certificate for a PRATICO course from the practical exam alone', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        course_id: 'course-1',
        course: { code: 'CTA-PRA', modality: 'PRATICO' },
        theoryExams: [],
        practicalExams: [{ result: 'APROVADO' }],
        attendances: [{ id: 'attendance-1' }],
      });
      storage.upload.mockResolvedValue('certificates/org-1/CERT-125.pdf');
      prisma.certificate.create.mockResolvedValue({
        id: 'certificate-3',
        certificate_number: 'CERT-org-1-125',
        file_url: 'certificates/org-1/CERT-125.pdf',
        issued_at: new Date('2026-01-03'),
      });
      prisma.enrollment.update.mockResolvedValue({});

      const result = await service.issueCertificate(ORG_ID, certDto);

      expect(result.id).toBe('certificate-3');
      expect(prisma.qualification.create).not.toHaveBeenCalled();
    });

    it('blocks re-issuing a certificate for an enrollment that already has one', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student_id: 'student-1',
        course_id: 'course-1',
        course: { code: 'PPL-101', modality: 'MISTO' },
        theoryExams: [{ result: 'APROVADO' }],
        practicalExams: [{ result: 'APROVADO' }],
        attendances: [{ id: 'attendance-1' }],
      });
      prisma.certificate.findFirst.mockResolvedValue({ id: 'existing-certificate' });

      await expect(service.issueCertificate(ORG_ID, certDto)).rejects.toThrow(BadRequestException);
      expect(storage.upload).not.toHaveBeenCalled();
    });
  });

  describe('RN-05: min_passing_score derives the exam result when none is given explicitly', () => {
    const scoredExamDto = {
      type: ExamType.TEORICO,
      enrollment_id: 'enrollment-1',
      exam_date: '2026-01-01',
    };

    it('derives APROVADO when the score meets the course minimum', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: null },
        theoryExams: [],
        practicalExams: [],
        attendances: [],
        course: { min_passing_score: '70.00', modality: 'MISTO', code: 'X' },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-1' });

      await service.registerExam(ORG_ID, { ...scoredExamDto, score: 75 });

      expect(prisma.theoryExam.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ result: 'APROVADO' }) }),
      );
    });

    it('derives REPROVADO when the score is below the course minimum', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: null },
        theoryExams: [],
        practicalExams: [],
        attendances: [],
        course: { min_passing_score: '70.00', modality: 'MISTO', code: 'X' },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-2' });

      await service.registerExam(ORG_ID, { ...scoredExamDto, score: 40 });

      expect(prisma.theoryExam.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ result: 'REPROVADO' }) }),
      );
    });

    it('respects an explicit result even when a score and course minimum are both present', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: null },
        theoryExams: [],
        practicalExams: [],
        attendances: [],
        course: { min_passing_score: '70.00', modality: 'MISTO', code: 'X' },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-3' });

      await service.registerExam(ORG_ID, { ...scoredExamDto, score: 95, result: 'PENDENTE' });

      expect(prisma.theoryExam.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ result: 'PENDENTE' }) }),
      );
    });

    it('falls back to PENDENTE when there is a score but the course has no minimum configured', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: null },
        theoryExams: [],
        practicalExams: [],
        attendances: [],
        course: { min_passing_score: null, modality: 'MISTO', code: 'X' },
      });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-4' });

      await service.registerExam(ORG_ID, { ...scoredExamDto, score: 95 });

      expect(prisma.theoryExam.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ result: 'PENDENTE' }) }),
      );
    });
  });

  describe('RN-05: automatic certificate issuance on exam/attendance registration', () => {
    const teoricoExamDto = {
      type: ExamType.TEORICO,
      enrollment_id: 'enrollment-1',
      exam_date: '2026-01-01',
    };

    it('auto-issues the certificate when registering the exam that completes a TEORICO course', async () => {
      prisma.enrollment.findFirst
        .mockResolvedValueOnce({
          id: 'enrollment-1',
          student: { fraud_quarantine_until: null },
          course: { min_passing_score: '70.00', modality: 'TEORICO', code: 'CTA-TEO' },
        })
        .mockResolvedValueOnce({
          id: 'enrollment-1',
          student_id: 'student-1',
          course_id: 'course-1',
          theoryExams: [{ result: 'APROVADO' }],
          practicalExams: [],
          attendances: [{ id: 'attendance-1' }],
          course: { code: 'CTA-TEO', modality: 'TEORICO' },
        });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-1' });
      storage.upload.mockResolvedValue('certificates/org-1/CERT-1.pdf');
      prisma.certificate.create.mockResolvedValue({
        id: 'certificate-1',
        certificate_number: 'CERT-org-1-1',
        file_url: 'certificates/org-1/CERT-1.pdf',
        issued_at: new Date('2026-01-01'),
      });
      prisma.enrollment.update.mockResolvedValue({});
      prisma.qualification.create.mockResolvedValue({ id: 'qualification-1' });

      const result = await service.registerExam(ORG_ID, { ...teoricoExamDto, score: 90 });

      expect(result).toEqual({ id: 'exam-1', type: ExamType.TEORICO });
      expect(prisma.certificate.create).toHaveBeenCalled();
      expect(prisma.qualification.create).toHaveBeenCalled();
    });

    it('does not auto-issue when the course requirements are still incomplete', async () => {
      prisma.enrollment.findFirst
        .mockResolvedValueOnce({
          id: 'enrollment-1',
          student: { fraud_quarantine_until: null },
          course: { min_passing_score: '70.00', modality: 'MISTO', code: 'PPL-101' },
        })
        .mockResolvedValueOnce({
          id: 'enrollment-1',
          theoryExams: [{ result: 'APROVADO' }],
          practicalExams: [],
          attendances: [{ id: 'attendance-1' }],
          course: { code: 'PPL-101', modality: 'MISTO' },
        });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-2' });

      await service.registerExam(ORG_ID, { ...teoricoExamDto, score: 90 });

      expect(prisma.certificate.create).not.toHaveBeenCalled();
    });

    it('does not issue a second certificate when the enrollment already has one', async () => {
      prisma.enrollment.findFirst.mockResolvedValue({
        id: 'enrollment-1',
        student: { fraud_quarantine_until: null },
        course: { min_passing_score: '70.00', modality: 'TEORICO', code: 'CTA-TEO' },
      });
      prisma.certificate.findFirst.mockResolvedValue({ id: 'existing-certificate' });
      prisma.theoryExam.create.mockResolvedValue({ id: 'exam-3' });

      await service.registerExam(ORG_ID, { ...teoricoExamDto, score: 90 });

      expect(prisma.certificate.create).not.toHaveBeenCalled();
    });

    it('auto-issues the certificate when registering the attendance that completes a course', async () => {
      const attendanceDto = {
        enrollment_id: 'enrollment-1',
        lesson_id: 'lesson-1',
        date: '2026-01-01',
      };
      prisma.enrollment.findFirst
        .mockResolvedValueOnce({ id: 'enrollment-1' })
        .mockResolvedValueOnce({
          id: 'enrollment-1',
          student_id: 'student-1',
          course_id: 'course-1',
          theoryExams: [{ result: 'APROVADO' }],
          practicalExams: [{ result: 'APROVADO' }],
          attendances: [{ id: 'attendance-1' }],
          course: { code: 'PPL-101', modality: 'MISTO' },
        });
      prisma.lesson.findFirst.mockResolvedValue({ id: 'lesson-1' });
      prisma.attendance.create.mockResolvedValue({ id: 'attendance-1' });
      storage.upload.mockResolvedValue('certificates/org-1/CERT-2.pdf');
      prisma.certificate.create.mockResolvedValue({
        id: 'certificate-2',
        certificate_number: 'CERT-org-1-2',
        file_url: 'certificates/org-1/CERT-2.pdf',
        issued_at: new Date('2026-01-01'),
      });
      prisma.enrollment.update.mockResolvedValue({});

      await service.registerAttendance(ORG_ID, attendanceDto);

      expect(prisma.certificate.create).toHaveBeenCalled();
    });
  });

  describe('createQualification: manual entry for PRATICO courses', () => {
    const qualDto = {
      student_id: 'student-1',
      course_id: 'course-1',
      qualification_code: 'CTA-PRA',
      issued_at: '2026-01-01',
    };

    it('throws NotFoundException when the student does not belong to the organization', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.createQualification(ORG_ID, qualDto)).rejects.toThrow(NotFoundException);
      expect(prisma.qualification.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the course does not belong to the organization (IDOR)', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.course.findFirst.mockResolvedValue(null);

      await expect(service.createQualification(ORG_ID, qualDto)).rejects.toThrow(NotFoundException);
      expect(prisma.qualification.create).not.toHaveBeenCalled();
    });

    it('creates the qualification once student (and course, if given) are validated', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.course.findFirst.mockResolvedValue({ id: 'course-1' });
      prisma.qualification.create.mockResolvedValue({ id: 'qualification-2' });

      const result = await service.createQualification(ORG_ID, qualDto);

      expect(result).toEqual({ id: 'qualification-2' });
      expect(prisma.qualification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            organization_id: ORG_ID,
            student_id: 'student-1',
            course_id: 'course-1',
            qualification_code: 'CTA-PRA',
          }),
        }),
      );
    });

    it('creates the qualification without a course_id (no course to validate)', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
      prisma.qualification.create.mockResolvedValue({ id: 'qualification-3' });

      const result = await service.createQualification(ORG_ID, {
        student_id: 'student-1',
        qualification_code: 'CTA-EXTERNA',
        issued_at: '2026-01-01',
      });

      expect(result).toEqual({ id: 'qualification-3' });
      expect(prisma.course.findFirst).not.toHaveBeenCalled();
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

  describe('inviteStudentToPortal: LMS portal login provisioning', () => {
    it('blocks inviting a student that has no email set', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 'student-1', email: null, user_profile_id: null });

      await expect(service.inviteStudentToPortal(ORG_ID, 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(supabaseAdmin.inviteStudent).not.toHaveBeenCalled();
    });

    it('blocks inviting a student that already has a linked user profile', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: 'student-1',
        email: 'aluno@example.com',
        user_profile_id: 'user-1',
      });

      await expect(service.inviteStudentToPortal(ORG_ID, 'student-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(supabaseAdmin.inviteStudent).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a student outside the organization', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(service.inviteStudentToPortal(ORG_ID, 'student-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates the auth user, a UserProfile, and links it to the student', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: 'student-1',
        email: 'aluno@example.com',
        full_name: 'Aluno Teste',
        user_profile_id: null,
      });
      supabaseAdmin.inviteStudent.mockResolvedValue('user-1');
      prisma.userProfile.create.mockResolvedValue({ id: 'user-1' });
      prisma.student.update.mockResolvedValue({ id: 'student-1', user_profile_id: 'user-1' });

      const result = await service.inviteStudentToPortal(ORG_ID, 'student-1');

      expect(supabaseAdmin.inviteStudent).toHaveBeenCalledWith('aluno@example.com', ORG_ID);
      expect(prisma.userProfile.create).toHaveBeenCalledWith({
        data: {
          id: 'user-1',
          organization_id: ORG_ID,
          email: 'aluno@example.com',
          full_name: 'Aluno Teste',
          roles: ['ALUNO'],
        },
      });
      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: { user_profile_id: 'user-1' },
      });
      expect(result).toEqual({ id: 'student-1', user_profile_id: 'user-1' });
    });
  });
});
