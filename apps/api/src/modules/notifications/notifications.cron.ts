import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CourseStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationJobType } from './notifications.constants';

/** RN-20: alert threshold for an inactive course. */
const COURSE_INACTIVE_ALERT_DAYS = 150;
/** RN-20: suspension threshold for an inactive course. */
const COURSE_INACTIVE_SUSPEND_DAYS = 180;
/** RN-22: mandatory ANAC communications must be flagged 60 days ahead. */
const ANAC_COMMUNICATION_NOTICE_DAYS = 60;
/** Generic look-ahead window for expiry-style alerts. */
const DEFAULT_LOOKAHEAD_DAYS = 30;

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Daily — qualifications expiring within the look-ahead window. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkQualificationExpiry(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + DEFAULT_LOOKAHEAD_DAYS);

    const qualifications = await this.prisma.qualification.findMany({
      where: { deleted_at: null, expires_at: { not: null, lte: threshold } },
    });

    for (const qualification of qualifications) {
      await this.notifications.enqueue(NotificationJobType.QUALIFICATION_EXPIRY, {
        organizationId: qualification.organization_id,
        entityId: qualification.id,
        message: `Qualification ${qualification.qualification_code} expires at ${qualification.expires_at?.toISOString()}`,
      });
    }
  }

  /** Daily — instructor proficiencies approaching their annual renewal (RN-16). */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkInstructorProficiency(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + DEFAULT_LOOKAHEAD_DAYS);

    const proficiencies = await this.prisma.proficiency.findMany({
      where: { deleted_at: null, valid_until: { lte: threshold } },
      include: { instructor: true },
    });

    for (const proficiency of proficiencies) {
      await this.notifications.enqueue(NotificationJobType.INSTRUCTOR_PROFICIENCY, {
        organizationId: proficiency.organization_id,
        entityId: proficiency.id,
        message: `Instructor ${proficiency.instructor.full_name} proficiency expires at ${proficiency.valid_until.toISOString()}`,
      });
    }
  }

  /** Daily — CMA documents expiring soon. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkCmaExpiry(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + DEFAULT_LOOKAHEAD_DAYS);

    const cmas = await this.prisma.cMA.findMany({
      where: { deleted_at: null, expires_at: { lte: threshold } },
      include: { instructor: true },
    });

    for (const cma of cmas) {
      await this.notifications.enqueue(NotificationJobType.CMA_EXPIRY, {
        organizationId: cma.organization_id,
        entityId: cma.id,
        message: `CMA for instructor ${cma.instructor.full_name} expires at ${cma.expires_at.toISOString()}`,
      });
    }
  }

  /** Daily — commercial contracts approaching their end date. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkContractExpiry(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + DEFAULT_LOOKAHEAD_DAYS);

    const contracts = await this.prisma.contract.findMany({
      where: { deleted_at: null, end_date: { not: null, lte: threshold } },
    });

    for (const contract of contracts) {
      await this.notifications.enqueue(NotificationJobType.CONTRACT_EXPIRY, {
        organizationId: contract.organization_id,
        entityId: contract.id,
        message: `Contract ${contract.contract_number} expires at ${contract.end_date?.toISOString()}`,
      });
    }
  }

  /**
   * Daily — RN-22: any mandatory ANAC communication must be flagged 60 days
   * ahead of its deadline. Modeled here against SemestralReport.deadline,
   * the closest concrete "must notify ANAC by X" date in the current schema.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async checkAnacCommunicationDeadlines(): Promise<void> {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + ANAC_COMMUNICATION_NOTICE_DAYS);

    const reports = await this.prisma.semestralReport.findMany({
      where: { deleted_at: null, submitted_at: null, deadline: { lte: threshold } },
    });

    for (const report of reports) {
      await this.notifications.enqueue(NotificationJobType.ANAC_COMMUNICATION, {
        organizationId: report.organization_id,
        entityId: report.id,
        message: `ANAC communication due by ${report.deadline.toISOString()} (RN-22, 60-day notice)`,
      });
    }
  }

  /**
   * Fires 15/jun (targeting the 15/jul deadline) and 15/dez (targeting the
   * 15/jan deadline) creating/alerting the semestral report obligation.
   */
  @Cron('0 6 15 6,12 *')
  async fireSemestralReportObligation(): Promise<void> {
    const now = new Date();
    const isJune = now.getMonth() === 5; // 0-indexed: June
    const deadline = isJune
      ? new Date(now.getFullYear(), 6, 15) // 15/jul
      : new Date(now.getFullYear() + 1, 0, 15); // 15/jan (next year)

    const organizations = await this.prisma.organization.findMany({ where: { deleted_at: null } });

    for (const organization of organizations) {
      const period = `${now.getFullYear()}-${isJune ? 'S1' : 'S2'}`;
      const report = await this.prisma.semestralReport.create({
        data: { organization_id: organization.id, period, deadline },
      });

      await this.notifications.enqueue(NotificationJobType.SEMESTRAL_REPORT, {
        organizationId: organization.id,
        entityId: report.id,
        message: `Semestral report for ${period} is due by ${deadline.toISOString()}`,
      });
    }

    this.logger.log(`Semestral report obligations fired for ${organizations.length} organizations`);
  }

  /** Daily — RN-20: alert inactive courses at 150 days, suspend at 180 days. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async checkCourseInactivity(): Promise<void> {
    const alertThreshold = new Date();
    alertThreshold.setDate(alertThreshold.getDate() - COURSE_INACTIVE_ALERT_DAYS);
    const suspendThreshold = new Date();
    suspendThreshold.setDate(suspendThreshold.getDate() - COURSE_INACTIVE_SUSPEND_DAYS);

    const coursesToSuspend = await this.prisma.course.findMany({
      where: {
        deleted_at: null,
        status: { not: CourseStatus.SUSPENSO },
        last_activity_at: { lte: suspendThreshold },
      },
    });

    for (const course of coursesToSuspend) {
      await this.prisma.course.update({
        where: { id: course.id },
        data: { status: CourseStatus.SUSPENSO },
      });
      await this.notifications.enqueue(NotificationJobType.COURSE_INACTIVE, {
        organizationId: course.organization_id,
        entityId: course.id,
        message: `Course ${course.name} suspended after ${COURSE_INACTIVE_SUSPEND_DAYS} days of inactivity (RN-20)`,
      });
    }

    const coursesToAlert = await this.prisma.course.findMany({
      where: {
        deleted_at: null,
        status: CourseStatus.ATIVO,
        last_activity_at: { lte: alertThreshold, gt: suspendThreshold },
      },
    });

    for (const course of coursesToAlert) {
      await this.prisma.course.update({
        where: { id: course.id },
        data: { status: CourseStatus.ALERTA_INATIVIDADE },
      });
      await this.notifications.enqueue(NotificationJobType.COURSE_INACTIVE, {
        organizationId: course.organization_id,
        entityId: course.id,
        message: `Course ${course.name} flagged inactive after ${COURSE_INACTIVE_ALERT_DAYS} days (RN-20)`,
      });
    }
  }
}
