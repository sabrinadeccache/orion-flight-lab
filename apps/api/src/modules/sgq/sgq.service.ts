import { Injectable } from '@nestjs/common';

@Injectable()
export class SgqService {
  name(): string {
    return 'sgq';
  }
}
