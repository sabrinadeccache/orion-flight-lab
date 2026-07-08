import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { AcademicModule } from '../academic/academic.module';

@Module({
  imports: [AcademicModule],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
