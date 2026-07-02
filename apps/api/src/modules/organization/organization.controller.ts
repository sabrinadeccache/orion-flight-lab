import { Controller, Get } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.organizationService.name() };
  }
}
