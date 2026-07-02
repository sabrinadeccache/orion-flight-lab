import { Controller, Get } from '@nestjs/common';
import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('ping')
  ping(): { module: string } {
    return { module: this.trainingService.name() };
  }
}
