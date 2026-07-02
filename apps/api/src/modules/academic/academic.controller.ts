import { Controller, Get } from '@nestjs/common';
import { AcademicService } from './academic.service';

@Controller('academic')
export class AcademicController {
  constructor(private readonly academicService: AcademicService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.academicService.name() };
  }
}
