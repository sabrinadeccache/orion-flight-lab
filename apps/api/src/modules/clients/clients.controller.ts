import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@orion/shared';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateClientUnitDto } from './dto/create-client-unit.dto';
import { CreateContactDto } from './dto/create-contact.dto';

/** Mirrors the '/clients' entry in apps/web/src/middleware.ts ROUTE_ROLES. */
@Controller('clients')
@UseGuards(SupabaseAuthGuard, OrganizationGuard, RolesGuard)
@Roles(Role.ADMIN, Role.COMERCIAL)
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

  @Patch(':id')
  @AuditLog({ action: 'update', entity: 'Client' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientsService.updateClient(user.organizationId, id, dto);
  }

  @Delete(':id')
  @AuditLog({ action: 'delete', entity: 'Client' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.clientsService.deleteClient(user.organizationId, id);
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
