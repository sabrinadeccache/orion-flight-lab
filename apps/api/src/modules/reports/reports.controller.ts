import { Controller, Get } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.reportsService.name() };
  }
}
