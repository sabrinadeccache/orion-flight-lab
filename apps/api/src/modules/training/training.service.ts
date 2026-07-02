import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingService {
  name(): string {
    return 'training';
  }
}
