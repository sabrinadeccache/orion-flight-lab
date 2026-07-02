import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateClientUnitDto } from './dto/create-client-unit.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('clients')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Client' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClientDto) {
    return this.clientsService.createClient(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.clientsService.findClients(user.organizationId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.clientsService.findClient(user.organizationId, id);
  }

  @Post('units')
  @AuditLog({ action: 'create', entity: 'ClientUnit' })
  createUnit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClientUnitDto) {
    return this.clientsService.createClientUnit(user.organizationId, dto);
  }

  @Post('contacts')
  @AuditLog({ action: 'create', entity: 'Contact' })
  createContact(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContactDto) {
    return this.clientsService.createContact(user.organizationId, dto);
  }
}
