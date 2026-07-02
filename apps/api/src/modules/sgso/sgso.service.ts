import { Injectable } from '@nestjs/common';

@Injectable()
export class SgsoService {
  name(): string {
    return 'sgso';
  }
}
