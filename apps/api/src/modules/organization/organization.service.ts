import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganizationService {
  name(): string {
    return 'organization';
  }
}
