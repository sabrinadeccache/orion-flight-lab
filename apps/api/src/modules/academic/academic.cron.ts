import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AcademicService } from './academic.service';

/** RN-13: daily job that recomputes expired qualification/enrollment statuses. */
@Injectable()
export class AcademicCron {
  private readonly logger = new Logger(AcademicCron.name);

  constructor(private readonly academicService: AcademicService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiryUpdate(): Promise<void> {
    const result = await this.academicService.updateExpiredStatuses();
    this.logger.log(
      `RN-13 daily expiry sweep: ${result.qualifications} qualifications, ${result.enrollments} enrollments updated`,
    );
  }
}
