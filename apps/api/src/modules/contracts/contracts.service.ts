import { Injectable } from '@nestjs/common';

@Injectable()
export class ContractsService {
  name(): string {
    return 'contracts';
  }
}
