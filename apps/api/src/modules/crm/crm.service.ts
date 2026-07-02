import { Injectable } from '@nestjs/common';

@Injectable()
export class CrmService {
  name(): string {
    return 'crm';
  }
}
