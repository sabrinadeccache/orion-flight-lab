import { Injectable } from '@nestjs/common';

@Injectable()
export class FinancialService {
  name(): string {
    return 'financial';
  }
}
