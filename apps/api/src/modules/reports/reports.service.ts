import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  name(): string {
    return 'reports';
  }
}
