import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { OrganizationGuard } from '../auth/guards/organization.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuditLog } from '../auth/decorators/audit-log.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { CreateContractAmendmentDto } from './dto/create-contract-amendment.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Controller('contracts')
@UseGuards(SupabaseAuthGuard, OrganizationGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @AuditLog({ action: 'create', entity: 'Contract' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContractDto) {
    return this.contractsService.createContract(user.organizationId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.findContracts(user.organizationId);
  }

  @Post('amendments')
  @AuditLog({ action: 'create', entity: 'ContractAmendment' })
  createAmendment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateContractAmendmentDto) {
    return this.contractsService.createAmendment(user.organizationId, dto);
  }

  @Post('plans')
  @AuditLog({ action: 'create', entity: 'Plan' })
  createPlan(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlanDto) {
    return this.contractsService.createPlan(user.organizationId, dto);
  }

  @Get('plans')
  findPlans(@CurrentUser() user: AuthenticatedUser) {
    return this.contractsService.findPlans(user.organizationId);
  }

  @Post('subscriptions')
  @AuditLog({ action: 'create', entity: 'Subscription' })
  createSubscription(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSubscriptionDto) {
    return this.contractsService.createSubscription(user.organizationId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contractsService.findContract(user.organizationId, id);
  }

  @Patch(':id')
  @AuditLog({ action: 'update', entity: 'Contract' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.updateContract(user.organizationId, id, dto);
  }

  @Delete(':id')
  @AuditLog({ action: 'delete', entity: 'Contract' })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.contractsService.deleteContract(user.organizationId, id);
  }
}
