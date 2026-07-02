import { Controller, Get } from '@nestjs/common';
import { SgqService } from './sgq.service';

@Controller('sgq')
export class SgqController {
  constructor(private readonly sgqService: SgqService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.sgqService.name() };
  }
}
