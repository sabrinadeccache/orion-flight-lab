import { Module } from '@nestjs/common';
import { InstructorsController } from './instructors.controller';
import { ExaminersController } from './examiners.controller';
import { PersonnelService } from './personnel.service';

@Module({
  controllers: [InstructorsController, ExaminersController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
