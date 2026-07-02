import { Injectable } from '@nestjs/common';

@Injectable()
export class ClientsService {
  name(): string {
    return 'clients';
  }
}
