import { Injectable, NotFoundException } from '@nestjs/common';
import { Client, ClientUnit, Contact } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateClientUnitDto } from './dto/create-client-unit.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  createClient(organizationId: string, dto: CreateClientDto): Promise<Client> {
    return this.prisma.client.create({ data: { organization_id: organizationId, ...dto } });
  }

  findClients(organizationId: string): Promise<Client[]> {
    return this.prisma.client.findMany({ where: { organization_id: organizationId, deleted_at: null } });
  }

  async findClient(organizationId: string, id: string): Promise<Client> {
    const client = await this.prisma.client.findFirst({
      where: { id, organization_id: organizationId, deleted_at: null },
      include: { units: true, contacts: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async createClientUnit(organizationId: string, dto: CreateClientUnitDto): Promise<ClientUnit> {
    await this.assertClientInOrg(organizationId, dto.client_id);
    return this.prisma.clientUnit.create({ data: { organization_id: organizationId, ...dto } });
  }

  async createContact(organizationId: string, dto: CreateContactDto): Promise<Contact> {
    await this.assertClientInOrg(organizationId, dto.client_id);
    return this.prisma.contact.create({ data: { organization_id: organizationId, ...dto } });
  }

  /** Prevents linking a unit/contact to another organization's client. */
  private async assertClientInOrg(organizationId: string, clientId: string): Promise<void> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, organization_id: organizationId, deleted_at: null },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');
  }
}
