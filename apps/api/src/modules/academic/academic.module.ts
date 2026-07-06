import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { EnrollmentsController } from './enrollments.controller';
import { ExamsController } from './exams.controller';
import { AttendanceController } from './attendance.controller';
import { CertificatesController } from './certificates.controller';
import { QualificationsController } from './qualifications.controller';
import { AcademicService } from './academic.service';
import { AcademicCron } from './academic.cron';

@Module({
  controllers: [
    StudentsController,
    EnrollmentsController,
    ExamsController,
    AttendanceController,
    CertificatesController,
    QualificationsController,
  ],
  providers: [AcademicService, AcademicCron],
  exports: [AcademicService],
})
export class AcademicModule {}
