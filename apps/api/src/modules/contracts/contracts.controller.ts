import { Controller, Get } from '@nestjs/common';
import { ContractsService } from './contracts.service';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.contractsService.name() };
  }
}
