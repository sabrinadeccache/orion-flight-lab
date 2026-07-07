import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AircraftQualification,
  CMA,
  Examiner,
  Instructor,
  InstructorLessonLog,
  Proficiency,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { CreateExaminerDto } from './dto/create-examiner.dto';
import { UpdateExaminerDto } from './dto/update-examiner.dto';
import { CreateQualificationDto } from './dto/create-qualification.dto';
import { CreateCmaDto } from './dto/create-cma.dto';
import { CreateProficiencyDto } from './dto/create-proficiency.dto';
import { CreateLessonLogDto } from './dto/create-lesson-log.dto';

/** RN-17 / RN-18: at most 2 simultaneous aircraft type qualifications. */
const MAX_AIRCRAFT_QUALIFICATIONS = 2;
/** RN-16: renewal window, in days, around the previous valid_until. */
const PROFICIENCY_RENEWAL_WINDOW_DAYS = 45;
/** RN-15: max instructor teaching hours within a rolling 24h window. */
const MAX_DAILY_INSTRUCTOR_HOURS = 8;

@Injectable()
export class PersonnelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ---------------------------------------------------------------------
  // Instructors
  // ---------------------------------------------------------------------

  createInstructor(organizationId: string, dto: CreateInstructorDto): Promise<Instructor> {
    return this.prisma.instructor.create({
      data: { organization_id: organizationId, ...dto },
    });
  }

  findInstructors(organizationId: string): Promise<Instructor[]> {
    return this.prisma.instructor.findMany({
      where: { organization_id: organizationId, deleted_at: null },
    });
  }

  async findInstructor(organizationId: string, id: string) {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { qualifications: true, cmas: true, proficiencies: true },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');
    return instructor;
  }

  async updateInstructor(
    organizationId: string,
    id: string,
    dto: UpdateInstructorDto,
  ): Promise<Instructor> {
    await this.findInstructor(organizationId, id);
    return this.prisma.instructor.update({ where: { id }, data: dto });
  }

  async deleteInstructor(organizationId: string, id: string): Promise<void> {
    await this.findInstructor(organizationId, id);
    await this.prisma.instructor.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /** RN-17: an instructor may hold at most 2 aircraft type qualifications. */
  async addInstructorQualification(
    organizationId: string,
    instructorId: string,
    dto: CreateQualificationDto,
  ): Promise<AircraftQualification> {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id: instructorId, organization_id: organizationId, deleted_at: null },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    const current = await this.prisma.aircraftQualification.count({
      where: { instructor_id: instructorId, deleted_at: null },
    });
    if (current >= MAX_AIRCRAFT_QUALIFICATIONS) {
      throw new BadRequestException(
        `Instructor already holds ${MAX_AIRCRAFT_QUALIFICATIONS} aircraft type qualifications (RN-17)`,
      );
    }

    return this.prisma.aircraftQualification.create({
      data: {
        organization_id: organizationId,
        instructor_id: instructorId,
        aircraft_type: dto.aircraft_type,
        qualification_type: dto.qualification_type,
        issued_at: new Date(dto.issued_at),
        expires_at: new Date(dto.expires_at),
      },
    });
  }

  /** CMA control — validity, upload to instructor-docs, and expiry alerts. */
  async addCma(
    organizationId: string,
    instructorId: string,
    dto: CreateCmaDto,
    file?: Buffer,
  ): Promise<CMA> {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id: instructorId, organization_id: organizationId, deleted_at: null },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    const documentUrl = file
      ? await this.storage.upload(
          'instructor-docs',
          organizationId,
          `cma/${instructorId}-${Date.now()}.pdf`,
          file,
          'application/pdf',
        )
      : undefined;

    return this.prisma.cMA.create({
      data: {
        organization_id: organizationId,
        instructor_id: instructorId,
        document_url: documentUrl,
        issued_at: new Date(dto.issued_at),
        expires_at: new Date(dto.expires_at),
      },
    });
  }

  async getExpiringCmas(organizationId: string, days: number): Promise<CMA[]> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return this.prisma.cMA.findMany({
      where: { organization_id: organizationId, deleted_at: null, expires_at: { lte: threshold } },
      orderBy: { expires_at: 'asc' },
      include: { instructor: true },
    });
  }

  /** RN-16: annual proficiency renewal, within 45 days before/after expiry. */
  async addProficiency(
    organizationId: string,
    instructorId: string,
    dto: CreateProficiencyDto,
  ): Promise<Proficiency> {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id: instructorId, organization_id: organizationId, deleted_at: null },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    const last = await this.prisma.proficiency.findFirst({
      where: { instructor_id: instructorId, deleted_at: null },
      orderBy: { valid_until: 'desc' },
    });

    if (last) {
      const evaluatedAt = new Date(dto.evaluated_at);
      const windowStart = new Date(last.valid_until);
      windowStart.setDate(windowStart.getDate() - PROFICIENCY_RENEWAL_WINDOW_DAYS);
      const windowEnd = new Date(last.valid_until);
      windowEnd.setDate(windowEnd.getDate() + PROFICIENCY_RENEWAL_WINDOW_DAYS);

      if (evaluatedAt < windowStart || evaluatedAt > windowEnd) {
        throw new BadRequestException(
          `Proficiency renewal must occur within 45 days of the previous expiry (RN-16)`,
        );
      }
    }

    return this.prisma.proficiency.create({
      data: {
        organization_id: organizationId,
        instructor_id: instructorId,
        evaluated_at: new Date(dto.evaluated_at),
        valid_until: new Date(dto.valid_until),
        evaluator_name: dto.evaluator_name,
      },
    });
  }

  /** RN-15: blocks lesson registration once the rolling 24h total exceeds 8h. */
  async registerLessonLog(
    organizationId: string,
    instructorId: string,
    dto: CreateLessonLogDto,
  ): Promise<InstructorLessonLog> {
    const instructor = await this.prisma.instructor.findFirst({
      where: { id: instructorId, organization_id: organizationId, deleted_at: null },
    });
    if (!instructor) throw new NotFoundException('Instructor not found');

    const deliveredAt = new Date(dto.delivered_at);
    const windowStart = new Date(deliveredAt.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd = new Date(deliveredAt.getTime() + 24 * 60 * 60 * 1000);

    const recentLogs = await this.prisma.instructorLessonLog.findMany({
      where: {
        instructor_id: instructorId,
        deleted_at: null,
        delivered_at: { gte: windowStart, lte: windowEnd },
      },
    });

    const alreadyLogged = recentLogs.reduce((sum, log) => sum + Number(log.hours), 0);
    if (alreadyLogged + dto.hours > MAX_DAILY_INSTRUCTOR_HOURS) {
      throw new BadRequestException(
        `Instructor would exceed ${MAX_DAILY_INSTRUCTOR_HOURS}h within a 24h window (RN-15)`,
      );
    }

    return this.prisma.instructorLessonLog.create({
      data: {
        organization_id: organizationId,
        instructor_id: instructorId,
        course_id: dto.course_id,
        lesson_id: dto.lesson_id,
        hours: dto.hours,
        delivered_at: deliveredAt,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Examiners
  // ---------------------------------------------------------------------

  createExaminer(organizationId: string, dto: CreateExaminerDto): Promise<Examiner> {
    return this.prisma.examiner.create({
      data: { organization_id: organizationId, ...dto },
    });
  }

  findExaminers(organizationId: string): Promise<Examiner[]> {
    return this.prisma.examiner.findMany({
      where: { organization_id: organizationId, deleted_at: null },
    });
  }

  async findExaminer(organizationId: string, id: string) {
    const examiner = await this.prisma.examiner.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { qualifications: true },
    });
    if (!examiner) throw new NotFoundException('Examiner not found');
    return examiner;
  }

  async updateExaminer(
    organizationId: string,
    id: string,
    dto: UpdateExaminerDto,
  ): Promise<Examiner> {
    await this.findExaminer(organizationId, id);
    return this.prisma.examiner.update({ where: { id }, data: dto });
  }

  async deleteExaminer(organizationId: string, id: string): Promise<void> {
    await this.findExaminer(organizationId, id);
    await this.prisma.examiner.update({ where: { id }, data: { deleted_at: new Date() } });
  }

  /** RN-18: an examiner may hold at most 2 aircraft type accreditations. */
  async addExaminerQualification(
    organizationId: string,
    examinerId: string,
    dto: CreateQualificationDto,
  ): Promise<AircraftQualification> {
    const examiner = await this.prisma.examiner.findFirst({
      where: { id: examinerId, organization_id: organizationId, deleted_at: null },
    });
    if (!examiner) throw new NotFoundException('Examiner not found');

    const current = await this.prisma.aircraftQualification.count({
      where: { examiner_id: examinerId, deleted_at: null },
    });
    if (current >= MAX_AIRCRAFT_QUALIFICATIONS) {
      throw new BadRequestException(
        `Examiner already holds ${MAX_AIRCRAFT_QUALIFICATIONS} aircraft type accreditations (RN-18)`,
      );
    }

    return this.prisma.aircraftQualification.create({
      data: {
        organization_id: organizationId,
        examiner_id: examinerId,
        aircraft_type: dto.aircraft_type,
        qualification_type: dto.qualification_type,
        issued_at: new Date(dto.issued_at),
        expires_at: new Date(dto.expires_at),
      },
    });
  }
}
