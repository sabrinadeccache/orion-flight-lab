import { Injectable } from '@nestjs/common';

@Injectable()
export class PersonnelService {
  name(): string {
    return 'personnel';
  }
}
