import { Controller, Get } from '@nestjs/common';
import { SgsoService } from './sgso.service';

@Controller('sgso')
export class SgsoController {
  constructor(private readonly sgsoService: SgsoService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.sgsoService.name() };
  }
}
