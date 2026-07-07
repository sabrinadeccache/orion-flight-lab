import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Attendance,
  Certificate,
  CourseModality,
  Enrollment,
  EnrollmentStatus,
  ExamResult,
  ExpiryStatus,
  Qualification,
  Student,
} from '@prisma/client';
import { ExamType } from '@orion/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';

/** RN-11: a class/course may never have more than 25 active enrollments. */
const MAX_STUDENTS_PER_COURSE = 25;

@Injectable()
export class AcademicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async createStudent(organizationId: string, dto: CreateStudentDto): Promise<Student> {
    return this.prisma.student.create({
      data: {
        organization_id: organizationId,
        full_name: dto.full_name,
        cpf: dto.cpf,
        anac_record_number: dto.anac_record_number,
        birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
        active: dto.active,
      },
    });
  }

  findStudents(organizationId: string): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      orderBy: { full_name: 'asc' },
    });
  }

  async findStudent(organizationId: string, id: string): Promise<Student> {
    const student = await this.prisma.student.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async updateStudent(
    organizationId: string,
    id: string,
    dto: UpdateStudentDto,
  ): Promise<Student> {
    await this.findStudent(organizationId, id);
    return this.prisma.student.update({
      where: { id },
      data: {
        full_name: dto.full_name,
        cpf: dto.cpf,
        anac_record_number: dto.anac_record_number,
        birth_date: dto.birth_date ? new Date(dto.birth_date) : undefined,
        active: dto.active,
      },
    });
  }

  async deleteStudent(organizationId: string, id: string): Promise<void> {
    await this.findStudent(organizationId, id);
    await this.prisma.student.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /** RN-11: enrollment is blocked once the course reaches 25 active students. */
  async createEnrollment(organizationId: string, dto: CreateEnrollmentDto): Promise<Enrollment> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.student_id, organization_id: organizationId, deleted_at: null },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const course = await this.prisma.course.findFirst({
      where: { id: dto.course_id, organization_id: organizationId, deleted_at: null },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const activeEnrollments = await this.prisma.enrollment.count({
      where: {
        course_id: dto.course_id,
        organization_id: organizationId,
        status: EnrollmentStatus.ATIVA,
        deleted_at: null,
      },
    });

    if (activeEnrollments >= (course.max_students || MAX_STUDENTS_PER_COURSE)) {
      throw new BadRequestException(
        `Course has reached the maximum of ${course.max_students} active students (RN-11)`,
      );
    }

    const proof_url = `enrollments/${organizationId}/${dto.student_id}-${dto.course_id}-${Date.now()}.pdf`;

    return this.prisma.enrollment.create({
      data: {
        organization_id: organizationId,
        student_id: dto.student_id,
        course_id: dto.course_id,
        status: EnrollmentStatus.ATIVA,
        proof_url,
      },
    });
  }

  /**
   * Seção 142.71a6 — registers a theory or practical exam.
   * RN-07: blocked while the student is inside a 12-month fraud quarantine.
   */
  async registerExam(
    organizationId: string,
    dto: CreateExamDto,
  ): Promise<{ id: string; type: ExamType }> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollment_id, organization_id: organizationId, deleted_at: null },
      include: { student: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const quarantineUntil = enrollment.student.fraud_quarantine_until;
    if (quarantineUntil && quarantineUntil > new Date()) {
      throw new BadRequestException(
        `Student is in fraud quarantine until ${quarantineUntil.toISOString()} (RN-07)`,
      );
    }

    const baseData = {
      organization_id: organizationId,
      enrollment_id: dto.enrollment_id,
      instructor_id: dto.instructor_id,
      examiner_id: dto.examiner_id,
      exam_date: new Date(dto.exam_date),
      score: dto.score,
      result: dto.result ?? ExamResult.PENDENTE,
      attempt_number: dto.attempt_number ?? 1,
    };

    if (dto.type === ExamType.TEORICO) {
      const exam = await this.prisma.theoryExam.create({ data: baseData });
      return { id: exam.id, type: ExamType.TEORICO };
    }

    const exam = await this.prisma.practicalExam.create({ data: baseData });
    return { id: exam.id, type: ExamType.PRATICO };
  }

  /** Seção 142.71 — attendance record, read by RN-05 to gate certificate issuance. */
  async registerAttendance(organizationId: string, dto: CreateAttendanceDto): Promise<Attendance> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollment_id, organization_id: organizationId, deleted_at: null },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: dto.lesson_id, organization_id: organizationId, deleted_at: null },
    });
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    return this.prisma.attendance.create({
      data: {
        organization_id: organizationId,
        enrollment_id: dto.enrollment_id,
        lesson_id: dto.lesson_id,
        date: new Date(dto.date),
        present: dto.present ?? true,
      },
    });
  }

  /**
   * RN-05: a certificate can only be issued once every requirement of the
   * enrollment's course is complete (attendance recorded, plus the exam
   * type(s) the course's modality requires, all APROVADO):
   * TEORICO needs an approved theory exam, PRATICO needs an approved
   * practical exam, MISTO (default) needs both — same as before this
   * field existed, so pre-existing courses keep their old behavior.
   *
   * When the course is TEORICO, issuing the certificate also auto-creates
   * the student's Qualification (qualification_code = course.code). PRATICO
   * has no automatic path — see createQualification for the manual entry
   * point used for those.
   */
  async issueCertificate(
    organizationId: string,
    dto: CreateCertificateDto,
  ): Promise<{ id: string; certificate_number: string; file_url: string }> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: dto.enrollment_id, organization_id: organizationId, deleted_at: null },
      include: { theoryExams: true, practicalExams: true, attendances: true, course: true },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const hasApprovedTheory = enrollment.theoryExams.some((e) => e.result === 'APROVADO');
    const hasApprovedPractical = enrollment.practicalExams.some((e) => e.result === 'APROVADO');
    const hasAttendance = enrollment.attendances.length > 0;

    const modality = enrollment.course.modality;
    const hasRequiredExams =
      modality === CourseModality.TEORICO
        ? hasApprovedTheory
        : modality === CourseModality.PRATICO
          ? hasApprovedPractical
          : hasApprovedTheory && hasApprovedPractical;

    if (!hasRequiredExams || !hasAttendance) {
      throw new BadRequestException(
        'Cannot issue certificate: course requirements are incomplete (RN-05)',
      );
    }

    const certificateNumber = `CERT-${organizationId.slice(0, 8)}-${Date.now()}`;
    const fileName = `${certificateNumber}.pdf`;
    const fileUrl = await this.storage.upload(
      'certificates',
      organizationId,
      fileName,
      Buffer.from(''),
      'application/pdf',
    );

    const certificate = await this.prisma.certificate.create({
      data: {
        organization_id: organizationId,
        enrollment_id: enrollment.id,
        student_id: enrollment.student_id,
        certificate_number: certificateNumber,
        file_url: fileUrl,
      },
    });

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: EnrollmentStatus.CONCLUIDA, completed_at: new Date() },
    });

    if (modality === CourseModality.TEORICO) {
      await this.prisma.qualification.create({
        data: {
          organization_id: organizationId,
          student_id: enrollment.student_id,
          course_id: enrollment.course_id,
          certificate_id: certificate.id,
          qualification_code: enrollment.course.code,
          issued_at: certificate.issued_at,
        },
      });
    }

    return {
      id: certificate.id,
      certificate_number: certificate.certificate_number,
      file_url: fileUrl,
    };
  }

  /** Manual qualification entry — used for PRATICO courses (no auto-issuance path). */
  async createQualification(
    organizationId: string,
    dto: CreateQualificationDto,
  ): Promise<Qualification> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.student_id, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (dto.course_id) {
      const course = await this.prisma.course.findFirst({
        where: { id: dto.course_id, organization_id: organizationId, deleted_at: null },
        select: { id: true },
      });
      if (!course) {
        throw new NotFoundException('Course not found');
      }
    }

    return this.prisma.qualification.create({
      data: {
        organization_id: organizationId,
        student_id: dto.student_id,
        course_id: dto.course_id,
        qualification_code: dto.qualification_code,
        issued_at: new Date(dto.issued_at),
        expires_at: dto.expires_at ? new Date(dto.expires_at) : undefined,
      },
    });
  }

  findCertificates(organizationId: string): Promise<Certificate[]> {
    return this.prisma.certificate.findMany({
      where: { organization_id: organizationId, deleted_at: null },
      orderBy: { issued_at: 'desc' },
    });
  }

  /** Seção 142.71 — full academic history of a student. */
  async getStudentHistory(organizationId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, organization_id: organizationId, deleted_at: null },
      include: {
        enrollments: {
          include: {
            course: true,
            theoryExams: true,
            practicalExams: true,
            attendances: true,
            grades: true,
            certificates: true,
          },
        },
        certificates: true,
        qualifications: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async getExpiringQualifications(organizationId: string, days: number) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return this.prisma.qualification.findMany({
      where: {
        organization_id: organizationId,
        deleted_at: null,
        expires_at: { not: null, lte: threshold },
      },
      orderBy: { expires_at: 'asc' },
    });
  }

  /** RN-13: daily job — recompute expiry statuses. */
  async updateExpiredStatuses(): Promise<{ qualifications: number; enrollments: number }> {
    const now = new Date();

    const expiredQualifications = await this.prisma.qualification.updateMany({
      where: { expires_at: { lt: now }, status: { not: ExpiryStatus.VENCIDO }, deleted_at: null },
      data: { status: ExpiryStatus.VENCIDO },
    });

    const expiredEnrollments = await this.prisma.enrollment.updateMany({
      where: {
        status: EnrollmentStatus.ATIVA,
        deleted_at: null,
        course: { end_date: { lt: now } },
      },
      data: { status: EnrollmentStatus.EXPIRADA },
    });

    return {
      qualifications: expiredQualifications.count,
      enrollments: expiredEnrollments.count,
    };
  }
}
