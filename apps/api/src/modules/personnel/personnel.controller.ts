import { Controller, Get } from '@nestjs/common';
import { PersonnelService } from './personnel.service';

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.personnelService.name() };
  }
}
